import { useAppStore } from 'hooks/useAppStore';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
// import NigeriaStates from 'nigeria-states-lgas';
import statesAndLgas from '../../libs/nigerian-states.json';
import Dropzone from 'react-dropzone';
import { FC, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Button from 'components/base/Button';
import Input from 'components/base/form/Input';
import Select from 'components/base/form/Select';
import { getBase64Async } from 'libs/files';
import { yupResolver } from '@hookform/resolvers/yup';
import TextArea from 'components/base/form/TextArea';
import useKycHandler from 'hooks/useKycHandler';
import toast from 'react-hot-toast';
import useProperty from 'hooks/useProperty';
import { MdOutlineCancel } from 'react-icons/md';
import { Property, PropertySchema, UploadedFile } from 'interfaces';
import { CustomFile } from 'interfaces/CustomFile';
import Loader from 'components/base/Loader';
import { useRouter } from 'next/router';
import { getSubscriptionStatus } from 'utils/subscriptionUtils';
type ImageList = Array<{ base64: string; preview: string }>;

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

const schema = yup.object().shape({
    name: yup.string().required('Enter property name'),
    address: yup.string().required('Enter your address'),
    description: yup.string().required('Enter description'),
    price: yup.number().required('Enter price'),
    numberOfRooms: yup.string().when('propertyType', {
        is: (val: string) => val !== 'Land',
        then: () => yup.string().required('Enter number of bedroom'),
        otherwise: () => yup.string().notRequired(),
    }),
    numberOfBath: yup.string().when('propertyType', {
        is: (val: string) => val !== 'Land',
        then: () => yup.string().required('Enter number of bath'),
        otherwise: () => yup.string().notRequired(),
    }),
    state: yup.string().required('Select state'),
    city: yup.string().required('Select city'),
    status: yup.string().required('Select property status'),
    agreementEstimate: yup.number().required('Enter agreement estimate'),
    propertyType: yup.string().required('Select property type'),
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

interface PropertyProps {
    page?: string;
}

const PropertyForm: FC<PropertyProps> = ({ page }) => {
    const [images, setImages] = useState<ImageList>([]);
    const [selectedPropertyType, setSelectedPropertyType] = useState('');
    const states = useAppStore();
    const router = useRouter();

    // const { kycHandler, isLoading } = useKycHandler();
    const {
        createPropertyHandler,
        createPropertyLoading,
        propertyKycDocument,
        propertyKycLoading,
        getMyProperties,
        getPropertyLoading,
        updateProperty,
        updatePropertyLoading,
    } = useProperty();

    const [properties, setProperties] = useState<any>();

    const {
        handleSubmit,
        register,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
    });

    const [selectedState, setSelectedState] = useState('');
    const [lgas, setLgas] = useState<string[]>([]);

    // Watch the state and property type fields for changes
    const watchState = watch('state');
    const watchPropertyType = watch('propertyType');

    // Load cities when state changes programmatically
    useEffect(() => {
        if (watchState && watchState !== selectedState) {
            setSelectedState(watchState);
            setLgas(
                statesAndLgas[watchState as keyof typeof statesAndLgas] || []
            );
        }
    }, [watchState, selectedState]);

    // Handle property type changes
    useEffect(() => {
        if (watchPropertyType && watchPropertyType !== selectedPropertyType) {
            setSelectedPropertyType(watchPropertyType);
            // Clear rooms and baths if Land is selected
            if (watchPropertyType === 'Land') {
                setValue('numberOfRooms', '');
                setValue('numberOfBath', '');
            }
        }
    }, [watchPropertyType, selectedPropertyType, setValue]);

    const handleStateChange = (event: { target: { value: any } }) => {
        const state = event.target.value;
        setSelectedState(state);
        setValue('state', state); // Update form value

        // Load cities/LGAs for the selected state
        setLgas(statesAndLgas[state as keyof typeof statesAndLgas] || []);

        // Clear city selection when state changes
        setValue('city', '');
    };

    const onSubmit = async (data: any) => {
        // const subscriptionStatus = await getSubscriptionStatus(states?.user?.email || '');
        // if (subscriptionStatus !== 'active') {
        //     toast.error('You need an active subscription to perform this action.');
        //     return;
        // }
        const formData = new FormData();
        console.log('NoImageId>>>', images);
        // Create an array to store all the image upload promises
        const imageUploadPromises: Promise<any>[] = [];
        const docId = page && page === 'kyc' ? 7 : 6;
        const filteredImages: any[] = [];

        images
            .filter((file: any) => !file?.id) // Filter out images without ID
            .forEach((file: any, i: number) => {
                // Fetch the Blob data from the Blob URL

                const promise = fetch(file.blobURL)
                    .then((response) => response.blob())
                    .then((blob) => {
                        formData.append(`doc${i + 1}_docTypeID`, `${docId}`);
                        formData.append(`doc${i + 1}_files`, blob);
                        formData.append(
                            `doc${i + 1}_description`,
                            `${data?.description}`
                        );
                        return {
                            file,
                            blob,
                        };
                    });

                imageUploadPromises.push(promise);
            });
        const resolvedImages = await Promise.all(imageUploadPromises);
        resolvedImages.forEach((param: any) => {
            if (param && param.file) {
                filteredImages.push(param.file);
            }
        });
        const newProperty =
            Array.isArray(properties) && properties.length ? properties[0] : {};
        const kycStage = page === 'kyc' ? { kycStage: 3 } : {};
        const category = page && page === 'kyc' ? { category: 'KYC' } : {};

        // console.log('newProperty>>>>', newProperty);

        const requestObj: PropertySchema = {
            ...newProperty,
            name: data?.name,
            price: data?.price,
            number_of_bedrooms:
                data?.numberOfRooms ||
                (data?.propertyType === 'Land' ? 0 : data?.numberOfRooms),
            number_of_bath:
                data?.numberOfBath ||
                (data?.propertyType === 'Land' ? 0 : data?.numberOfBath),
            address: data?.address,
            status: data?.status,
            description: data?.description,
            city: data?.city,
            state: data?.state,
            propertyType: data?.propertyType,
            agreement_estimate: data?.agreementEstimate,
            land_size: landedPropertyTypes.includes(data?.propertyType)
                ? data?.landSize
                : undefined,
            ...kycStage,
            ...category,
            year_built: 2023,
            accountType: states?.activeKyc?.accountType,
        };

        for (var key in requestObj) {
            const value = requestObj[key as keyof PropertySchema];

            if (value !== undefined) {
                if (typeof value === 'number' || typeof value === 'string') {
                    formData.append(key, value.toString());
                } else if (typeof value === 'object') {
                    formData.append(key, JSON.stringify(value));
                }
            }
        }

        // Validate the number of images
        const isPropertiesEmpty =
            Array.isArray(properties) && properties.length < 1;
        const isImagesEmpty = images.length === 0;
        const isInsufficientImages = images.length < 2;

        if ((isPropertiesEmpty && isImagesEmpty) || isInsufficientImages) {
            toast.error('Please upload at least 2 new images.');
            return;
        }

        if (page && page === 'kyc') {
            try {
                await Promise.all(imageUploadPromises); // Wait for all image upload promises to resolve
                if (!!filteredImages.length) {
                    //Use create or update property api with  images
                    const res = await propertyKycDocument(formData);
                    const newKycStage = res?.data?.currentKyc?.kycStage ?? 0;
                    res.data.currentKyc.kycStage = newKycStage;
                    states?.setActiveKyc(res?.data?.currentKyc);
                    states?.setKycStage(newKycStage);
                    states?.setStep(res?.data?.currentKyc?.nextStage);
                    states?.setScreen('kycCompleted');
                    states?.setStartKycScreen('');
                    toast.success('KYC Property successfully created.');
                    return;
                }
                //Use update property api without images
                const res = await updateProperty(requestObj);
                if (res && res?.data?.data) {
                    states?.setScreen('kycCompleted');
                    states?.setStartKycScreen('');
                    toast.success('KYC Property successfully updated.');
                }
            } catch (error: any) {
                toast.error(error.message);
            }
        } else {
            try {
                await Promise.all(imageUploadPromises); // Wait for all image upload promises to resolve;

                const res = await createPropertyHandler(formData);
                states?.setScreen('');
                states?.setStartKycScreen('');
                toast.success('Property successfully created.');
                router.push('/dashboard/properties');
            } catch (error: any) {
                toast.error(error?.message);
            }
        }
    };

    const handleDrop = useCallback(
        async (dropped: File[], id?: string | null) => {
            const ls = dropped.map(async (el) => {
                const imageId: any = {};
                if (id) {
                    imageId.id = id;
                }
                return {
                    ...imageId,
                    base64: await getBase64Async(el),
                    preview: URL.createObjectURL(el),
                    blobURL: URL.createObjectURL(el), // Use blobURL instead of blob
                };
            });

            const imgPromises = (await Promise.all(ls)).filter(
                (el) => el.base64
            ) as ImageList;

            // Set images
            setImages((prev) => [...prev, ...imgPromises]);
            register('images', {
                value: imgPromises,
                validate: validateImages,
            });
        },
        [register]
    );

    const removeImage = (i: number) => {
        const updatedImages = [...images];
        updatedImages.splice(i, 1);
        setImages(updatedImages);
    };

    const validateImages = (images: ImageList) => {
        return images.length >= 3 || 'Please upload a minimum of 3 images.';
    };

    const convertImageUrlToFile = (imageUrl: string): Promise<File> => {
        return new Promise((resolve, reject) => {
            fetch(imageUrl)
                .then((response) => response.blob())
                .then((blob) => {
                    const file = new File(
                        [blob],
                        imageUrl?.split('/').pop() || '',
                        {
                            type: blob.type,
                        }
                    );
                    resolve(file);
                })
                .catch((error) => {
                    console.error(
                        'Error occurred while converting image to file:',
                        error
                    );
                    reject(error);
                });
        });
    };

    useEffect(() => {
        // Patches or edit existing proerpty details for kyc
        const property = getMyProperties?.data?.data[0];
        // console.log('propertytttt', property);
        if (page && page === 'kyc' && property?.id) {
            setProperties(getMyProperties?.data?.data);
            const defaultValues = {
                name: property?.name,
                price: property?.price,
                numberOfRooms: property?.number_of_bedrooms,
                numberOfBath: property?.number_of_bath,
                address: property?.address,
                status: property?.status,
                description: property?.description,
                city: property?.location?.city,
                state: property?.location?.state,
                year_bullt: property?.year_built,
                propertyType: property?.propertyType || property?.apartmentType,
                agreementEstimate:
                    property?.agreementEstimate || property?.agreement_estimate,
                landSize: property?.land_size,
            };
            // const imageFile: File[] = [];
            const imageFilePromises = property.image_list.map(
                (image: UploadedFile, i: number) => {
                    return convertImageUrlToFile(image?.urls[0]);
                }
            );

            Promise.all(imageFilePromises)
                .then((imageFiles) => {
                    handleDrop(imageFiles, property?.id);
                })
                .catch((error) => {
                    console.error(
                        'Error occurred while converting image URLs to files:',
                        error
                    );
                    // Handle the error
                });
            //Update property form with the return property data
            Object.entries(defaultValues).forEach(([key, value]) => {
                setValue(key, value);
            });

            // Load cities/LGAs for the property's state
            if (property?.location?.state) {
                setSelectedState(property.location.state);
                setLgas(
                    statesAndLgas[
                        property.location.state as keyof typeof statesAndLgas
                    ] || []
                );
            }
        }
    }, [getMyProperties?.data?.data, handleDrop, page, setValue]);

    return getPropertyLoading ? (
        <Loader loading={getPropertyLoading} />
    ) : (
        <div>
            <> {errors.images && errors?.images?.message}</>
            <form className=" py-20" onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Property name"
                        required
                        placeholder="Enter property name"
                        asterisk
                        register={{ ...register('name') }}
                        error={errors.name}
                        inputClassName="bg-white"
                    />
                    <Input
                        label="Property Address"
                        required
                        placeholder="Enter address"
                        asterisk
                        register={{ ...register('address') }}
                        error={errors.address}
                        inputClassName="bg-white"
                    />
                    <Select
                        label="State"
                        placeholder="Select a State"
                        selectDivClassName="bg-white"
                        required
                        register={{ ...register('state') }}
                        error={errors.state}
                        onChange={handleStateChange}
                    >
                        <option disabled value="">
                            Select State
                        </option>
                        {Object.keys(statesAndLgas).map((state, i) => (
                            <option key={i} value={state}>
                                {state}
                            </option>
                        ))}
                    </Select>

                    {/* LGA Dropdown */}
                    <Select
                        label="City"
                        placeholder="Select a City"
                        selectDivClassName="bg-white"
                        required
                        register={{ ...register('city') }}
                        error={errors.city}
                        // disabled={!selectedState}
                    >
                        <option disabled value="">
                            Select City
                        </option>
                        {lgas.map((lga, i) => (
                            <option key={i} value={lga}>
                                {lga}
                            </option>
                        ))}
                    </Select>
                    <Select
                        label="Property Type"
                        placeholder="Select Property Type"
                        selectDivClassName="bg-white"
                        register={{ ...register('propertyType') }}
                        error={errors.propertyType}
                    >
                        <option disabled value="">
                            Select Property Type
                        </option>
                        {Object.entries(propertyTypes).map(
                            ([category, types]) => (
                                <optgroup key={category} label={category}>
                                    {types.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </optgroup>
                            )
                        )}
                    </Select>
                    {/* Conditional fields based on property type */}
                    {watchPropertyType !== 'Land' && (
                        <>
                            <Input
                                label="Number of Rooms(Maximum of 6 rooms)"
                                type="number"
                                min={1}
                                max={6}
                                maxLength={6}
                                required
                                placeholder="Number of Rooms"
                                asterisk
                                register={{ ...register('numberOfRooms') }}
                                error={errors.numberOfRooms}
                                inputClassName="bg-white"
                            />
                            <Input
                                label="Number of Bathrooms(Maximum of 6 bathrooms)"
                                type="number"
                                min={1}
                                max={6}
                                required
                                placeholder="Number of Bathrooms"
                                asterisk
                                register={{ ...register('numberOfBath') }}
                                error={errors.numberOfBath}
                                inputClassName="bg-white"
                            />
                        </>
                    )}

                    {/* Land size fields for landed properties */}
                    {landedPropertyTypes.includes(watchPropertyType) && (
                        <>
                            <Input
                                label="Land Size"
                                type="number"
                                min={0}
                                required
                                placeholder="Enter land size"
                                asterisk
                                register={{ ...register('landSize.value') }}
                                error={
                                    errors.landSize &&
                                    typeof errors.landSize === 'object' &&
                                    'value' in errors.landSize
                                        ? (errors.landSize.value as any)
                                        : undefined
                                }
                                inputClassName="bg-white"
                            />
                            <Select
                                label="Land Size Unit"
                                placeholder="Select Unit"
                                selectDivClassName="bg-white"
                                required
                                register={{ ...register('landSize.unit') }}
                                error={
                                    errors.landSize &&
                                    typeof errors.landSize === 'object' &&
                                    'unit' in errors.landSize
                                        ? (errors.landSize.unit as any)
                                        : undefined
                                }
                            >
                                <option disabled value="">
                                    Select Unit
                                </option>
                                <option value="sqft">Square Feet</option>
                                <option value="sqm">Square Meters</option>
                                <option value="acres">Acres</option>
                                <option value="hectares">Hectares</option>
                            </Select>
                        </>
                    )}
                    <Input
                        label="Price"
                        required
                        placeholder="Price"
                        asterisk
                        register={{ ...register('price') }}
                        error={errors.price}
                        inputClassName="bg-white"
                    />
                    <Input
                        label="Agreement Estimate"
                        type="number"
                        required
                        placeholder="Agreement Estimate"
                        asterisk
                        register={{ ...register('agreementEstimate') }}
                        error={errors.agreementEstimate}
                        inputClassName="bg-white"
                    />
                    <Select
                        label="Property is for"
                        placeholder="Select property type"
                        selectDivClassName="bg-white"
                        required
                        register={{ ...register('status') }}
                        error={errors.status}
                    >
                        <option value="RENT">RENT</option>
                        <option value="SELL">SELL</option>
                    </Select>
                    <TextArea
                        label="Description"
                        placeholder="Add description"
                        register={{ ...register('description') }}
                        error={errors.description}
                        TextAreaClassName="bg-white"
                    />
                </div>
                <div className="mt-20 mb-28">
                    <div className="border border-dashed bg-white border-gray-400 text-gray-500 rounded-lg lg:w-7/12 h-[230px]">
                        <Dropzone
                            onDrop={(dropped) => handleDrop(dropped)}
                            noKeyboard
                        >
                            {({ getRootProps, getInputProps }) => (
                                <div
                                    {...getRootProps()}
                                    className="grid gap-4 justify-items-center py-6 px-5 h-full w-full"
                                >
                                    {!images.length && images.length === 1 && (
                                        <Image
                                            alt=""
                                            width={200}
                                            height={200}
                                            src={images[0].preview}
                                        />
                                    )}

                                    <input {...getInputProps()} multiple />

                                    <svg
                                        width="40"
                                        height="41"
                                        viewBox="0 0 40 41"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M18.3337 33.8333H10.8337C8.30588 33.8333 6.14588 32.9583 4.35366 31.2083C2.56144 29.4583 1.66588 27.3194 1.66699 24.7916C1.66699 22.625 2.31977 20.6944 3.62533 19C4.93088 17.3055 6.63922 16.2222 8.75033 15.75C9.44477 13.1944 10.8337 11.125 12.917 9.54163C15.0003 7.95829 17.3614 7.16663 20.0003 7.16663C23.2503 7.16663 26.0075 8.29885 28.272 10.5633C30.5364 12.8277 31.6681 15.5844 31.667 18.8333C33.5837 19.0555 35.1742 19.8822 36.4387 21.3133C37.7031 22.7444 38.3348 24.4177 38.3337 26.3333C38.3337 28.4166 37.6042 30.1877 36.1453 31.6466C34.6864 33.1055 32.9159 33.8344 30.8337 33.8333H21.667V21.9166L24.3337 24.5L26.667 22.1666L20.0003 15.5L13.3337 22.1666L15.667 24.5L18.3337 21.9166V33.8333Z"
                                            fill="#9A9999"
                                        />
                                    </svg>
                                    <h3>Accepts .gif, .jpg, and .png</h3>
                                    <p className="text-sm">
                                        Upload a minimum of 3 photos, Each photo
                                        must not exceed 5mb.
                                    </p>
                                </div>
                            )}
                        </Dropzone>
                    </div>

                    {images.length > 0 && (
                        <div className="grid grid-cols-4 gap-5 mt-10">
                            {images.map((img, i) => (
                                <div
                                    key={i}
                                    className="relative flex justify-center border-2 border-white h-72 rounded-3xl"
                                >
                                    <Image
                                        alt=""
                                        fill
                                        className="inline-block object-cover rounded-3xl"
                                        src={img.base64}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(i)}
                                        className="absolute p-1 bg-white top-[-4px] right-[-7px] rounded-full text-xl"
                                    >
                                        <MdOutlineCancel />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex w-4/6 gap-5 col-span-2 mx-auto my-10">
                    <Button
                        type="button"
                        onClick={states?.goBack}
                        variant="default"
                        className="w-full py-4"
                    >
                        Previous
                    </Button>
                    {page === 'kyc' ? (
                        <Button
                            className="w-full py-4"
                            type="submit"
                            isLoading={propertyKycLoading}
                            loadingText="creating property..."
                        >
                            Complete
                        </Button>
                    ) : (
                        <Button
                            className="w-full py-4"
                            type="submit"
                            isLoading={
                                createPropertyLoading || updatePropertyLoading
                            }
                            loadingText="creating property..."
                        >
                            Add property
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default PropertyForm;
