import Button from 'components/base/Button';
import { BiArrowBack } from 'react-icons/bi';
import useAccountType from 'hooks/useAccountType';
import { useAppStore } from 'hooks/useAppStore';
import Dashboard from '..';
import statesAndLgas from '../../../libs/nigerian-states.json';
import Image from 'next/image';
import { FC, ReactFragment, ReactNode, useEffect, useState } from 'react';
import BackButton from 'components/base/BackButton';
import useProperty from 'hooks/useProperty';
import { useRouter } from 'next/router';
import { Property } from 'interfaces';
import { goBackToKyc2 } from 'utils/helper';
import { getSidedProp } from '@tanstack/react-query-devtools/build/lib/utils';
import Loader from 'components/base/Loader';
import DropdownDialog from 'components/base/DropdownDialog';
import { DialogModal } from 'components/base/DialogModal';
import { PropertyService } from 'services';
import toast from 'react-hot-toast';
import Input from 'components/base/form/Input';
import Select from 'components/base/form/Select';
import nigeriaStates from 'nigeria-states-lgas';
import { set, useForm } from 'react-hook-form';
import TextArea from 'components/base/form/TextArea';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const propertyTypes = {
    Apartments: ['Flat', 'Studio', 'Penthouse', 'Loft'],
    'Landed Properties': [
        'Bungalow',
        'Duplex',
        'Detached House',
        'Semi-Detached',
        'Terraced House',
        'Mansion',
        'Villa',
        'Land',
    ],
    Commercial: ['Office', 'Shop', 'Warehouse'],
};

const landedPropertyTypes = [
    'Bungalow',
    'Duplex',
    'Detached House',
    'Semi-Detached',
    'Terraced House',
    'Mansion',
    'Villa',
    'Land',
];

// Helper function to parse land_size if it's a JSON string
const parseLandSize = (landSize: any) => {
    if (!landSize) return null;
    if (typeof landSize === 'string') {
        try {
            return JSON.parse(landSize);
        } catch (error) {
            console.error('Error parsing land_size:', error);
            return null;
        }
    }
    return landSize;
};

// Helper function to get processed property data
const getProcessedProperty = (property: any) => {
    if (!property) return null;
    return {
        ...property,
        land_size: parseLandSize(property.land_size),
        propertyType:
            property.propertyType ||
            property.apartmentType ||
            (property.number_of_bedrooms === 0 && property.number_of_bath === 0
                ? 'Land'
                : 'Flat'),
    };
};

const propertyUpdateSchema = yup.object().shape({
    name: yup.string().required('Property name is required'),
    price: yup
        .number()
        .positive('Price must be positive')
        .required('Price is required'),
    number_of_bedrooms: yup.number().when('propertyType', {
        is: (val: string) => val !== 'Land',
        then: () =>
            yup
                .number()
                .positive('Number of bedrooms must be positive')
                .required('Number of bedrooms is required'),
        otherwise: () => yup.number().min(0).notRequired(),
    }),
    number_of_bath: yup.number().when('propertyType', {
        is: (val: string) => val !== 'Land',
        then: () =>
            yup
                .number()
                .positive('Number of bathrooms must be positive')
                .required('Number of bathrooms is required'),
        otherwise: () => yup.number().min(0).notRequired(),
    }),
    address: yup.string().required('Address is required'),
    status: yup
        .string()
        .oneOf(['RENT', 'BUY', 'SELL'], 'Invalid status')
        .required('Status is required'),
    description: yup.string().required('Description is required'),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    propertyType: yup.string().required('Property type is required'),
    apartmentType: yup.string().notRequired(),
    year_built: yup.string().required('Year built is required'),
    is_active: yup.boolean().required('Property status is required'),
    landSize: yup.object().when('propertyType', {
        is: (val: string) => landedPropertyTypes.includes(val),
        then: () =>
            yup.object().shape({
                value: yup.number().required('Enter land size'),
                unit: yup.string().required('Select land size unit'),
            }),
        otherwise: () => yup.object().notRequired(),
    }),
});

interface DetailsProps {
    label?: string;
    content?: any;
    className?: string | number | undefined;
}

interface DetailsRowProps {
    children?: ReactNode;
    title?: string | undefined;
}

const DetailsCard: FC<DetailsProps> = ({ label, className, content }) => {
    return (
        <div className="flex flex-col w-full">
            <label className="pb-2">{label}</label>
            <div
                className={`transparent-bg p-3 flex-1 rounded-md text-base ${className}`}
            >
                {content}
            </div>
        </div>
    );
};

const DetailsRowCard: FC<DetailsRowProps> = ({ title, children }) => {
    return (
        <div className="flex flex-col mb-8">
            <h3 className="font-bold text-xl">{title}</h3>
            <div className="flex gap-4 my-5 w-full">{children}</div>
        </div>
    );
};

export default function PropertyDetails() {
    const states = useAppStore();
    const { acctType } = useAccountType();
    const { query } = useRouter();
    const router = useRouter();
    const id = query?.id as string | undefined;
    const {
        getProperty,
        getPropertyLoading,
        updateProperty,
        updatePropertyLoading,
    } = useProperty(id);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const property = getProcessedProperty(getProperty?.data);
    const [editable, setEditable] = useState(false);
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
        reset,
    } = useForm({
        resolver: yupResolver(propertyUpdateSchema),
        defaultValues: {
            name: '',
            price: 0,
            number_of_bedrooms: 0,
            number_of_bath: 0,
            address: '',
            status: 'RENT' as 'RENT' | 'BUY' | 'SELL',
            description: '',
            city: '',
            state: '',
            apartmentType: '',
            propertyType: '',
            year_built: '',
            is_active: true,
            landSize: {
                value: 0,
                unit: '',
            },
        },
    });

    const [formData, setFormData] = useState({
        name: property?.name,
        price: property?.price,
        number_of_bedrooms: property?.number_of_bedrooms,
        number_of_bath: property?.number_of_bath,
        address: property?.address,
        status: property?.status as 'RENT' | 'BUY' | 'SELL' | undefined,
        description: property?.description,
        location: {
            city: property?.location?.city,
            state: property?.location?.state,
        },
        year_built: property?.year_built,
        propertyType: property?.propertyType || property?.apartmentType,
        landSize: property?.land_size,
        is_active: property?.is_active,
    });

    const [selectedState, setSelectedState] = useState('');
    const [lgas, setLgas] = useState<string[]>([]);

    const handleEditable = (state: boolean) => {
        setEditable(state);

        if (state && property) {
            // Initialize form with property data when editing
            setValue('name', property.name || '');
            setValue('price', property.price || 0);
            setValue('number_of_bedrooms', property.number_of_bedrooms || 0);
            setValue('number_of_bath', property.number_of_bath || 0);
            setValue('address', property.address || '');
            setValue(
                'status',
                (property.status as 'RENT' | 'BUY' | 'SELL') || 'RENT'
            );
            setValue('description', property.description || '');
            setValue('city', property.location?.city || '');
            setValue('state', property.location?.state || '');
            // Set propertyType with fallback to apartmentType for backwards compatibility
            setValue(
                'propertyType',
                property.propertyType || property.apartmentType || ''
            );
            setValue('year_built', property.year_built || '');
            setValue('is_active', property.is_active ?? true);
            if (property.land_size) {
                setValue('landSize.value', property.land_size.value || 0);
                setValue('landSize.unit', property.land_size.unit || '');
            }

            setFormData({
                name: property?.name,
                price: property?.price,
                number_of_bedrooms: property?.number_of_bedrooms,
                number_of_bath: property?.number_of_bath,
                address: property?.address,
                status: property?.status as 'RENT' | 'BUY' | 'SELL' | undefined,
                description: property?.description,
                location: {
                    city: property?.location?.city,
                    state: property?.location?.state,
                },
                year_built: property?.year_built,
                propertyType: property?.propertyType || property?.apartmentType,
                landSize: property?.land_size,
                is_active: property?.is_active,
            });
        }
    };

    // const NigeriaState = formData?.location?.state;

    // console.log(property, 'formData');

    // @ts-ignore
    const openModal = (index) => {
        setSelectedImageIndex(index);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const openDialogModal = () => {
        setIsModalOpen(true);
    };

    const closeDialogModal = () => {
        setIsModalOpen(false);
    };

    const nextImage = () => {
        setSelectedImageIndex((prevIndex) =>
            prevIndex === property?.image_list.length - 1 ? 0 : prevIndex + 1
        );
    };

    const prevImage = () => {
        setSelectedImageIndex((prevIndex) =>
            prevIndex === 0 ? property?.image_list.length - 1 : prevIndex - 1
        );
    };

    const handleChange = (fieldName: string, value: any) => {
        let updatedValue = value;
        // Convert 'Active' or 'Off Market' to boolean true or false
        if (fieldName === 'is_active') {
            updatedValue = value === 'Active' ? true : false;
        }
        // Update formData with the converted value
        setFormData({
            ...formData,
            [fieldName]: updatedValue,
        });
    };

    const deleteProperty = async () => {
        if (!id) {
            console.error('Property ID is undefined.');
            return;
        }

        try {
            setIsLoading(true);
            await PropertyService.deletePropertyById(id);
            toast.success('Property deleted successfully');
            setIsLoading(false);
            setIsModalOpen(false);
            router.push('/dashboard/properties');
        } catch (error) {
            console.error('Error deleting property:', error);
            setIsLoading(false);
            toast.error('Error deleting property. Please try again later.');
        }
    };

    const editProperty = async (data: any) => {
        if (!id) {
            console.error('Property ID is undefined.');
            toast.error('Property ID is missing.');
            return;
        }

        try {
            setIsLoading(true);

            const partialProperty = {
                id: id,
                name: data.name,
                price: Number(data.price),
                number_of_bedrooms:
                    data.propertyType === 'Land'
                        ? 0
                        : Number(data.number_of_bedrooms || 0),
                number_of_bath:
                    data.propertyType === 'Land'
                        ? 0
                        : Number(data.number_of_bath || 0),
                address: data.address,
                status: data.status,
                description: data.description,
                city: data.city,
                state: data.state,
                year_built: data.year_built,
                // Use propertyType, but keep apartmentType for backwards compatibility
                propertyType: data.propertyType || data.apartmentType,
                apartmentType: data.propertyType || data.apartmentType, // Keep both in sync
                land_size: landedPropertyTypes.includes(data.propertyType)
                    ? data.landSize
                    : undefined,
                is_active: data.is_active,
            };

            await PropertyService.updatePropertyById(partialProperty);

            toast.success('Property updated successfully');
            setIsLoading(false);
            setEditable(false);
            router.reload();
        } catch (error: any) {
            console.error('Error updating property:', error);
            setIsLoading(false);

            // Better error handling
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                'Error updating property. Please try again later.';
            toast.error(errorMessage);
        }
    };

    const handleCityChange = (event: { target: { value: any } }) => {
        const city = event.target.value;
        setValue('city', city);
        setFormData({
            ...formData,
            location: {
                ...formData.location,
                city: city,
            },
        });
    };

    const handleStateChange = (event: { target: { value: any } }) => {
        const state = event.target.value;
        setSelectedState(state);
        setValue('state', state);
        setValue('city', ''); // Reset city when state changes
        setFormData({
            ...formData,
            location: {
                ...formData.location,
                state: state,
                city: '', // Reset city when state changes
            },
        });
        setLgas(statesAndLgas[state as keyof typeof statesAndLgas] || []);
    };

    // Initialize form when property data is loaded
    useEffect(() => {
        if (property && !editable) {
            setFormData({
                name: property?.name,
                price: property?.price,
                number_of_bedrooms: property?.number_of_bedrooms,
                number_of_bath: property?.number_of_bath,
                address: property?.address,
                status: property?.status as 'RENT' | 'BUY' | 'SELL' | undefined,
                description: property?.description,
                location: {
                    city: property?.location?.city,
                    state: property?.location?.state,
                },
                year_built: property?.year_built,
                propertyType: property?.propertyType || property?.apartmentType,
                landSize: property?.land_size,
                is_active: property?.is_active,
            });

            // Set LGAs for the current state
            if (property?.location?.state) {
                setSelectedState(property.location.state);
                setLgas(
                    statesAndLgas[
                        property.location.state as keyof typeof statesAndLgas
                    ] || []
                );
            }
        }
    }, [property, editable]);

    console.log(property, 'property');

    return (
        <div className="h-auto">
            <header className="flex flex-col lg:flex lg:justify-between lg:flex-row gap-8">
                <div className="flex gap-4 items-center">
                    <BackButton />
                    <h3 className="text-xl lg:text-2xl font-medium text-black">
                        Property details
                    </h3>
                </div>
                <div>
                    {acctType?.typeID === 2 && (
                        <div className="flex flex-col sm:flex-row justify-center lg:justify-end gap-4 items-center">
                            <div className="flex gap-5">
                                <Button
                                    title="List"
                                    href="/dashboard/properties"
                                    variant="default"
                                />
                                <Button
                                    title="Add Tenant"
                                    onClick={() => {
                                        const isUserVerify = goBackToKyc2(
                                            states,
                                            router
                                        );

                                        if (isUserVerify) {
                                            router.push(
                                                `/dashboard/tenants/add?q=${id}`
                                            );
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex gap-5">
                                <button
                                    className=" w-full flex justify-center items-center max-h-[47px] text-sm font-bold px-8 py-3   bg-primary-600 text-[#FFFFFF] rounded-lg  text-center hover:bg-primary-700 "
                                    data-action="notify"
                                    onClick={() => handleEditable(true)}
                                >
                                    Edit Property
                                </button>
                                <button
                                    className=" w-full flex justify-center items-center max-h-[47px] text-sm font-bold px-8 py-3   bg-[#DA0202] text-[#FFFFFF] rounded-lg  text-center hover:bg-primary-700 "
                                    data-action="notify"
                                    onClick={() => {
                                        openDialogModal();
                                    }}
                                >
                                    Delete Property
                                </button>
                            </div>

                            {/* <DropdownDialog title="More">
                            <li className="py-2 text-black border-b border-[#E7E5E5] last:border:0">
                                <button
                                    className="w-full px-3 py-2 text-left hover:bg-slate-50 font-medium"
                                    data-action="notify"
                                    onClick={() => handleEditable(true)}
                                >
                                    Edit Property
                                </button>
                            </li>
                            <li className="py-2 text-[#DA0202] border-b border-[#E7E5E5] last:border:0">
                                <button
                                    className="w-full px-3 py-2 text-left  hover:bg-slate-50 font-medium"
                                    data-action="receipt"
                                    onClick={() => {
                                        openDialogModal();
                                    }}
                                >
                                    Delete Property
                                </button>
                            </li>
                        </DropdownDialog> */}
                        </div>
                    )}
                </div>
            </header>

            {getPropertyLoading ? (
                <Loader loading={getPropertyLoading} />
            ) : (
                <section className="w-full bg-white my-10 p-5 rounded-md">
                    <DetailsRowCard title="General Information">
                        <div className="flex flex-row gap-4">
                            <div className="w-4/5">
                                <div onClick={() => openModal(0)}>
                                    <Image
                                        src={property?.image_list[0]?.urls[0]}
                                        alt="property placeholder 0"
                                        className="rounded-md"
                                        width={700}
                                        height={600}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col w-2/5">
                                <div onClick={() => openModal(1)}>
                                    <Image
                                        src={property?.image_list[1]?.urls[0]}
                                        alt="property placeholder 1"
                                        className="rounded-md"
                                        width={400}
                                        height={180}
                                    />
                                </div>
                                <div onClick={() => openModal(2)}>
                                    <Image
                                        src={property?.image_list[2]?.urls[0]}
                                        alt="property placeholder 2"
                                        className="rounded-md"
                                        width={400}
                                        height={200}
                                    />
                                </div>
                            </div>
                        </div>
                    </DetailsRowCard>

                    {showModal && (
                        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
                            <div className="relative">
                                <button
                                    onClick={prevImage}
                                    className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white rounded-full p-2"
                                >
                                    &lt;
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white rounded-full p-2"
                                >
                                    &gt;
                                </button>
                                <Image
                                    src={
                                        property?.image_list[selectedImageIndex]
                                            ?.urls[0]
                                    }
                                    alt={`Image ${selectedImageIndex}`}
                                    className="rounded-md transition-opacity duration-300"
                                    width={500}
                                    height={400}
                                />

                                <button
                                    onClick={closeModal}
                                    className="absolute top-0 right-0 m-4 text-black cursor-pointer"
                                >
                                    X
                                </button>
                            </div>
                        </div>
                    )}
                    <DetailsRowCard>
                        <div className="w-full">
                            <div className="lg:flex gap-4 mb-6">
                                <DetailsCard
                                    label="Property name"
                                    content={
                                        editable ? (
                                            <Input
                                                type="text"
                                                register={register('name')}
                                                error={errors.name}
                                                inputClassName="bg-white"
                                                placeholder="Enter property name"
                                            />
                                        ) : (
                                            property?.name
                                        )
                                    }
                                />
                                <DetailsCard
                                    label="Year build"
                                    content={
                                        editable ? (
                                            <Input
                                                type="text"
                                                register={register(
                                                    'year_built'
                                                )}
                                                error={errors.year_built}
                                                inputClassName="bg-white"
                                                placeholder="Enter year built"
                                            />
                                        ) : (
                                            property?.year_built
                                        )
                                    }
                                />
                            </div>
                            <div className="lg:flex gap-4">
                                <DetailsCard
                                    label="Property status"
                                    content={
                                        editable ? (
                                            <Select
                                                register={register('is_active')}
                                                error={errors.is_active}
                                                selectDivClassName="bg-white"
                                            >
                                                <option value="true">
                                                    Active
                                                </option>
                                                <option value="false">
                                                    Off Market
                                                </option>
                                            </Select>
                                        ) : property?.is_active ? (
                                            'Active'
                                        ) : (
                                            'Off Market'
                                        )
                                    }
                                />
                                <DetailsCard
                                    label="Price"
                                    content={
                                        editable ? (
                                            <Input
                                                type="number"
                                                register={register('price')}
                                                error={errors.price}
                                                inputClassName="bg-white"
                                                placeholder="Enter price"
                                            />
                                        ) : (
                                            'N' + property?.price.toFixed(2)
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </DetailsRowCard>

                    <DetailsRowCard title="Address Information">
                        <div className="w-full">
                            <div className="lg:flex gap-4 mb-6">
                                <DetailsCard
                                    label="Property address"
                                    content={
                                        editable ? (
                                            <Input
                                                type="text"
                                                register={register('address')}
                                                error={errors.address}
                                                inputClassName="bg-white"
                                                placeholder="Enter property address"
                                            />
                                        ) : (
                                            property?.address
                                        )
                                    }
                                />
                                <DetailsCard
                                    label="City"
                                    content={
                                        editable ? (
                                            <Select
                                                placeholder="Select a City"
                                                selectDivClassName="bg-white"
                                                required
                                                register={register('city')}
                                                error={errors.city}
                                                onChange={(e) =>
                                                    handleCityChange(e)
                                                }
                                            >
                                                <option disabled value="">
                                                    Select a City
                                                </option>
                                                {lgas.map((lga, i) => (
                                                    <option key={i} value={lga}>
                                                        {lga}
                                                    </option>
                                                ))}
                                            </Select>
                                        ) : (
                                            property?.location?.city
                                        )
                                    }
                                />
                            </div>
                            <div className="flex gap-4 lg:w-1/2">
                                <DetailsCard
                                    label="State"
                                    content={
                                        editable ? (
                                            <Select
                                                placeholder="Select a State"
                                                selectDivClassName="bg-white"
                                                required
                                                register={register('state')}
                                                error={errors.state}
                                                onChange={handleStateChange}
                                            >
                                                <option disabled value="">
                                                    Select a State
                                                </option>
                                                {Object.keys(statesAndLgas).map(
                                                    (state, i) => (
                                                        <option
                                                            key={i}
                                                            value={state}
                                                        >
                                                            {state}
                                                        </option>
                                                    )
                                                )}
                                            </Select>
                                        ) : (
                                            property?.location?.state
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </DetailsRowCard>
                    <DetailsRowCard title="Property Information">
                        <div className="w-full">
                            {/* Only show bedrooms and bathrooms for non-land properties */}
                            {(property?.propertyType ||
                                property?.apartmentType) !== 'Land' && (
                                <div className="lg:flex gap-4 mb-6">
                                    <DetailsCard
                                        label="Bedroom space"
                                        content={
                                            editable ? (
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    register={register(
                                                        'number_of_bedrooms'
                                                    )}
                                                    error={
                                                        errors.number_of_bedrooms
                                                    }
                                                    inputClassName="bg-white"
                                                    placeholder="Enter number of bedrooms"
                                                />
                                            ) : (
                                                property?.number_of_bedrooms
                                            )
                                        }
                                    />
                                    <DetailsCard
                                        label="Bathrooms"
                                        content={
                                            editable ? (
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={
                                                        formData?.number_of_bath
                                                    }
                                                    onChange={(e) =>
                                                        handleChange(
                                                            'number_of_bath',
                                                            e.target.value
                                                        )
                                                    }
                                                    inputClassName="bg-white"
                                                />
                                            ) : (
                                                property?.number_of_bath
                                            )
                                        }
                                    />
                                </div>
                            )}

                            {/* Show land size for land properties */}
                            {(property?.propertyType ||
                                property?.apartmentType) === 'Land' &&
                                property?.land_size && (
                                    <div className="lg:flex gap-4 mb-6">
                                        <DetailsCard
                                            label="Land Size"
                                            content={
                                                editable ? (
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            register={register(
                                                                'landSize.value'
                                                            )}
                                                            error={
                                                                errors.landSize &&
                                                                typeof errors.landSize ===
                                                                    'object' &&
                                                                'value' in
                                                                    errors.landSize
                                                                    ? (errors
                                                                          .landSize
                                                                          .value as any)
                                                                    : undefined
                                                            }
                                                            inputClassName="bg-white"
                                                            placeholder="Enter land size"
                                                        />
                                                        <Select
                                                            register={register(
                                                                'landSize.unit'
                                                            )}
                                                            error={
                                                                errors.landSize &&
                                                                typeof errors.landSize ===
                                                                    'object' &&
                                                                'unit' in
                                                                    errors.landSize
                                                                    ? (errors
                                                                          .landSize
                                                                          .unit as any)
                                                                    : undefined
                                                            }
                                                            selectDivClassName="bg-white"
                                                        >
                                                            <option value="">
                                                                Select Unit
                                                            </option>
                                                            <option value="sqft">
                                                                Square Feet
                                                            </option>
                                                            <option value="sqm">
                                                                Square Meters
                                                            </option>
                                                            <option value="acres">
                                                                Acres
                                                            </option>
                                                            <option value="hectares">
                                                                Hectares
                                                            </option>
                                                        </Select>
                                                    </div>
                                                ) : property?.land_size ? (
                                                    `${property.land_size.value} ${property.land_size.unit}`
                                                ) : (
                                                    'N/A'
                                                )
                                            }
                                        />
                                    </div>
                                )}

                            {/* Summary row for non-land properties */}
                            {(property?.propertyType ||
                                property?.apartmentType) !== 'Land' && (
                                <div className="lg:flex gap-4 mb-6">
                                    <DetailsCard
                                        label="No of rooms"
                                        content={property?.number_of_bedrooms}
                                    />
                                    <DetailsCard
                                        label="No of baths"
                                        content={property?.number_of_bath}
                                    />
                                </div>
                            )}
                            <div className="lg:flex gap-4 mb-6">
                                <DetailsCard
                                    label="Property Type"
                                    content={
                                        editable ? (
                                            <Select
                                                register={register(
                                                    'propertyType'
                                                )}
                                                error={errors.propertyType}
                                                selectDivClassName="bg-white"
                                            >
                                                <option disabled value="">
                                                    Select Property Type
                                                </option>
                                                {Object.entries(
                                                    propertyTypes
                                                ).map(([category, types]) => (
                                                    <optgroup
                                                        key={category}
                                                        label={category}
                                                    >
                                                        {types.map((type) => (
                                                            <option
                                                                key={type}
                                                                value={type}
                                                            >
                                                                {type}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </Select>
                                        ) : (
                                            property?.propertyType ||
                                            property?.apartmentType
                                        )
                                    }
                                />
                                <DetailsCard
                                    label="Property Status"
                                    content={property?.status}
                                />
                            </div>
                            <div className="lg:flex gap-4 h-auto">
                                <DetailsCard
                                    className="min-h-[200px]"
                                    label="Description"
                                    content={
                                        editable ? (
                                            <TextArea
                                                register={register(
                                                    'description'
                                                )}
                                                error={errors.description}
                                                TextAreaClassName="bg-white min-h-[150px]"
                                                placeholder="Enter property description"
                                            />
                                        ) : (
                                            property?.description
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </DetailsRowCard>
                    {editable ? (
                        <div className="flex w-4/6 gap-5 col-span-2 mx-auto mt-16 mb-2">
                            <Button
                                type="button"
                                onClick={() => setEditable(false)}
                                variant="default"
                                className="w-full py-4"
                            >
                                Cancel
                            </Button>

                            <Button
                                className="w-full py-4"
                                type="submit"
                                isLoading={isLoading}
                                onClick={handleSubmit(editProperty)}
                            >
                                Confirm
                            </Button>
                        </div>
                    ) : null}
                </section>
            )}
            <DialogModal
                openModal={isModalOpen}
                closeModal={closeModal}
                icon="/image1.svg"
                alternative="Trash Can"
                title={`Are you sure you want to delete this property?`}
                contentClass="w-full !py-10"
                className="rounded-md sm:ml-[40%] lg:ml-[10%] px-[10%]  lg:!top-[10%]"
            >
                <div>
                    <div className="flex w-4/6 gap-5 col-span-2 mx-auto mt-16 mb-2">
                        <Button
                            type="button"
                            onClick={() => {
                                closeDialogModal();
                            }}
                            variant="default"
                            className="w-full py-4"
                        >
                            Cancel
                        </Button>

                        <Button
                            className="w-full py-4"
                            type="submit"
                            isLoading={isLoading}
                            backgroundColor="bg-red-600"
                            onClick={() => deleteProperty()}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </DialogModal>
        </div>
    );
}

PropertyDetails.auth = true;
PropertyDetails.getLayout = Dashboard.getLayout;
