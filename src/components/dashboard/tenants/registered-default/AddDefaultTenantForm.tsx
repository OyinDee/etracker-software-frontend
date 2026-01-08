import TextArea from 'antd/es/input/TextArea';
import Button from 'components/base/Button';
import ToolTip from 'components/base/Tooltip';
import Checkbox from 'components/base/form/Checkbox';
import Input from 'components/base/form/Input';
import Select from 'components/base/form/Select';
import { useAppStore } from 'hooks/useAppStore';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { createDefaultTenant } from 'services/newServices/tenant';
import Image from 'next/image';
import Dropzone from 'react-dropzone';
import { MdOutlineCancel } from 'react-icons/md';
import { getBase64Async } from 'libs/files';
type ImageList = Array<{ id: number; base64: string; preview: string }>;
import { uploadImage } from 'services/newServices/image';
import useFileUploadHandler from 'hooks/useFileUploadHandler';
import {
    convertDataUrlToImageFile,
    generateRandomAlphanumeric,
} from 'utils/helper';
import { fetchAndFilterUsersByAccountType } from 'services/newServices/user';
import { getAllGeneralProperties } from 'services/newServices/properties';
import { getSubscriptionStatus } from 'utils/subscriptionUtils';
import Link from 'next/link';

export default function VerifyForm() {
    const [tenants, setTenants] = useState([] as any); // State to store the list of tenants
    const [selectedTenant, setSelectedTenant] = useState({} as any); // State to store the selected tenant
    const [images, setImages] = useState<File[]>([]);
    const [imageList, setImageList] = useState<string[]>([]);
    const [properties, setProperties] = useState([]);
    const [tenantProperty, setTenantProperty] = useState([]);
    const imageRef = useRef<HTMLInputElement>(null);
    const states = useAppStore();
    const landlordId = states?.user?.id;
    const [formState, setFormState] = useState({
        propertyAddress: '',
        complaints: '',
        landlordNIN: '',
        tenantNIN: '',
        proof: '',
        tenantEmail: '',
        tenantGender: '',
        tenantPhone: '',
        tenantName: '',
        agreed: false,
    });
    const {
        uploadedFiles,
        loadinguploadFiles,
        setUploadFileAsync,
        uploadProfileLoading,
    } = useFileUploadHandler('DEFAULT', 'default_image');

    // Fetch tenants on component mount
    useEffect(() => {
        const getTenants = async () => {
            const tenantsList = await fetchAndFilterUsersByAccountType();
            setTenants(tenantsList);
        };

        getTenants();
    }, []);

    useEffect(() => {
        const storedProperty = localStorage.getItem('filteredProperties');

        const property = JSON.parse(storedProperty as any);

        if (property) {
            setProperties(property);
            return;
        }

        async function fetchData() {
            const propertyData = await getAllGeneralProperties();
            setProperties(propertyData);
        }
        fetchData();
    }, []);

    // Handle tenant selection
    const handleTenantSelect = (tenantId: string) => {
        setTenantProperty([]);
        setFormState({
            ...formState,
            tenantName: '',
            tenantPhone: '',
            tenantEmail: '',
            tenantNIN: '',
            tenantGender: '',
        });
        const tenant = tenants.find((t: { id: string }) => t.id === tenantId);
        const filteredProperties = properties.filter((property: any) =>
            property.tenant.some((t: any) => t.tenantId === tenantId)
        );
        setTenantProperty(filteredProperties);
        setSelectedTenant(tenant);
        // Populate form fields with tenant data
        if (tenant) {
            setFormState({
                ...formState,
                tenantName: tenant.firstname + ' ' + tenant.lastname,
                tenantPhone: tenant.phone,
                tenantEmail: tenant.email,
                tenantNIN: tenant.nin,
                tenantGender: tenant.gender,
            });
        }
    };

    const updateFormState = (key: string, value: any) => {
        setFormState({ ...formState, [key]: value });
    };

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const subscriptionStatus = await getSubscriptionStatus(
            states?.user?.email || ''
        );
        // if (subscriptionStatus !== 'active') {
        //     toast.error(
        //         'You need an active subscription to perform this action.'
        //     );
        //     return;
        // }

        if (!formState.agreed) {
            toast.error('Please agree to the terms and conditions');
            return;
        }

        if (
            !formState.tenantName ||
            !formState.tenantPhone ||
            !formState.tenantEmail
        ) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formState.tenantPhone.length < 11) {
            toast.error('Invalid phone number');
            return;
        }

        if (!formState.tenantEmail.includes('@')) {
            toast.error('Invalid email address');
            return;
        }

        if (formState.tenantNIN.length < 11) {
            toast.error('NIN should be 11 characters!');
            return;
        }

        if (formState.landlordNIN.length < 11) {
            toast.error('NIN should be 11 characters!');
            return;
        }

        const data = {
            ...formState,
            landlordId,
            imageList,
        };

        const addDefault = await createDefaultTenant(data);
        // console.log(addDefault, 'Default response');

        if (addDefault) {
            toast.success('Tenant default added successfully');
            setFormState({
                propertyAddress: '',
                complaints: '',
                landlordNIN: '',
                tenantNIN: '',
                proof: '',
                tenantGender: '',
                tenantEmail: '',
                tenantPhone: '',
                tenantName: '',
                agreed: false,
            });
            setImages([]);
        }
    };

    // Function to handle file input change
    //@ts-ignore
    const handleFileChange = (e) => {
        const fileList = e.target.files;
        if (!fileList.length) return;

        const newImages = [...Array.from(fileList)];
        //@ts-ignore
        setImages(newImages);

        handleImageUpload(newImages[0]);
    };

    //@ts-ignore
    const handleImageUpload = (imageFile) => {
        const formData = new FormData();
        formData.append('doc1_docTypeID', '7');
        formData.append('doc1_docNo', `${generateRandomAlphanumeric()}`);
        formData.append('doc1_description', 'Default Images');
        formData.append('doc1_files', imageFile);

        uploadImage(formData)
            .then((data) => {
                console.log('Upload result', data);
                setImageList((prevList) => [...prevList, data.url]); // Save uploaded image URL
            })
            .catch((error) => {
                toast.error('Not Successful. ', error.message);
            });
    };

    const removeImage = (index: number) => {
        setImages((prevImages) => {
            const updatedImages = [...prevImages];
            updatedImages.splice(index, 1);
            return updatedImages;
        });
    };

    return (
        <form className="bg-white p-10">
            <section className="grid grid-cols-2 gap-6">
                <Select
                    label="Select Tenant"
                    // required
                    value={selectedTenant?.id || ''}
                    onChange={(e) => handleTenantSelect(e.target.value)}
                    className="bg-white"
                >
                    <option value="">Select a tenant</option>
                    {/* @ts-ignore */}
                    {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                            {tenant.firstname} {tenant.lastname}
                        </option>
                    ))}
                </Select>

                <Input
                    label="Tenant Name"
                    required
                    placeholder="Enter name "
                    asterisk
                    value={formState.tenantName}
                    onChange={(e) =>
                        updateFormState('tenantName', e.target.value)
                    }
                    // register={{ ...register('name') }}
                    // error={errors.name}
                    inputClassName="bg-white"
                />

                <Input
                    label="Tenant Phone number"
                    type="number"
                    required
                    placeholder="Enter phone number"
                    asterisk
                    value={formState.tenantPhone}
                    minLength={11}
                    onChange={(e) =>
                        updateFormState('tenantPhone', e.target.value)
                    }
                    // register={{ ...register('numberOfBath') }}
                    // error={errors.numberOfBath}
                    inputClassName="bg-white"
                />
                <Input
                    label="Your National identificaton number"
                    type="number"
                    required
                    minLength={11}
                    placeholder="Enter NIN number"
                    asterisk
                    value={formState.landlordNIN}
                    onChange={(e) =>
                        updateFormState('landlordNIN', e.target.value)
                    }
                    // register={{ ...register('numberOfRooms') }}
                    // error={errors.numberOfRooms}
                    inputClassName="bg-white"
                />

                <Input
                    label="Tenant National identificaton number"
                    type="number"
                    required
                    minLength={11}
                    placeholder="Enter NIN number"
                    asterisk
                    value={formState.tenantNIN}
                    onChange={(e) =>
                        updateFormState('tenantNIN', e.target.value)
                    }
                    // register={{ ...register('numberOfRooms') }}
                    // error={errors.numberOfRooms}
                    inputClassName="bg-white"
                />
                <Input
                    label="Tenant Email address"
                    type="email"
                    required
                    placeholder="Enter email address"
                    asterisk
                    value={formState.tenantEmail}
                    onChange={(e) =>
                        updateFormState('tenantEmail', e.target.value)
                    }
                    // register={{ ...register('numberOfBath') }}
                    // error={errors.numberOfBath}
                    inputClassName="bg-white"
                />

                {/* gender */}
                <Select
                    label="Gender"
                    required
                    value={formState.tenantGender}
                    onChange={(e) =>
                        updateFormState('tenantGender', e.target.value)
                    }
                    // register={{ ...register('gender') }}
                    // error={errors.gender}
                    className="bg-white"
                >
                    <option value="">
                        {formState.tenantGender || 'Select gender'}
                    </option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </Select>

                <section className="grid grid-cols-1 gap-6">
                    <Select
                        label="Select Available Tenant Property"
                        required
                        value={formState.propertyAddress}
                        onChange={(e) =>
                            updateFormState('propertyAddress', e.target.value)
                        }
                        className="bg-white col-span-2"
                    >
                        <option value="">Select a property</option>
                        {tenantProperty.map((property: any) => (
                            <option key={property.id} value={property.address}>
                                {property.name} - {property.address}
                            </option>
                        ))}
                    </Select>
                </section>

                <Input
                    label="Property Address"
                    type="text"
                    required
                    placeholder="Enter property address"
                    asterisk
                    value={formState.propertyAddress}
                    onChange={(e) =>
                        updateFormState('propertyAddress', e.target.value)
                    }
                    // register={{ ...register('numberOfBath') }}
                    // error={errors.numberOfBath}
                    inputClassName="bg-white col-span-1"
                />

                <textarea
                    className="bg-white border border-gray-300 rounded-md p-2 col-span-2"
                    required
                    value={formState.complaints}
                    placeholder="Enter your complaints"
                    onChange={(e) =>
                        updateFormState('complaints', e.target.value)
                    }
                />
            </section>

            <div className="mt-20 mb-28">
                <div className="border border-dashed bg-white border-gray-400 text-gray-500 rounded-lg lg:w-7/12 h-[130px]">
                    <input
                        ref={imageRef}
                        type="file"
                        accept=".jpg, .jpeg, .png, .gif"
                        multiple
                        className="opacity-0 invisible w-1"
                        onChange={handleFileChange}
                    />
                    <Button
                        type="button"
                        className="mt-3 disabled:bg-blue-500"
                        onClick={() => imageRef.current?.click()}
                    >
                        Upload Image
                    </Button>
                </div>

                {images?.length > 0 && (
                    <div className="grid grid-cols-4 gap-5 mt-10">
                        {images?.map((img, i) => (
                            <div
                                key={i}
                                className="relative flex justify-center border-2 border-white h-72 rounded-3xl"
                            >
                                <Image
                                    alt=""
                                    fill
                                    className="inline-block object-cover rounded-3xl"
                                    src={URL.createObjectURL(img)}
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

            <Checkbox
                className="mt-8"
                label={
                    <p>
                        By submitting this tenant default request, You agree
                        with our{' '}
                        <span className="text-[#2F42EDD9] text-xs md:text-sm">
                            <Link
                                href="/terms"
                                className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Terms and Conditions
                            </Link>
                        </span>
                    </p>
                }
                checked={formState.agreed}
                onChange={() => updateFormState('agreed', !formState.agreed)}
                // register={{ ...register('agreed') }}
                // error={errors.agreed}
            />

            <div className="w-1/2  mx-auto mb-10 mt-16">
                {/* @ts-ignore */}
                <Button onClick={onSubmit} className="w-full py-4">
                    Submit Request
                </Button>
            </div>
        </form>
    );
}
