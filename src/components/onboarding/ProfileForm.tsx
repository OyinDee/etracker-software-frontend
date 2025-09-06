import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
} from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useRouter } from 'next/router';
import nigeriaStates from 'nigeria-states-lgas';
import { base64ToURL } from 'libs/files';
import { FileUploadServices, UserService } from 'services';
import { useAppStore } from 'hooks/useAppStore';
import Button from 'components/base/Button';
import Input from 'components/base/form/Input';
import Select from 'components/base/form/Select';
import AvatarEditor from 'react-avatar-editor';
import useFileUploadHandler from 'hooks/useFileUploadHandler';
import {
    convertDataUrlToImageFile,
    generateRandomAlphanumeric,
} from 'utils/helper';
import Spinner from 'components/base/Spinner';
import { uploadImage } from '../../services/newServices/image';
import moment from 'moment';

const schema = yup.object({
    firstname: yup.string().required('Enter your first name'),
    email: yup.string().required('Enter your email address'),
    lastname: yup.string().required('Enter your last name'),
    phone: yup.string().required('Enter your phone number'),
    fullAddress: yup.string().required('Enter your address'),
    state: yup.string().required('Select state'),
    area: yup.string().required('Select local government area'),
    landmark: yup.string().required('Enter a landmark'),
    dob: yup.date().required('Enter your date of birth'),
    gender: yup.string().required('Select your gender'),
    country: yup.string().required('Select country'),
});

interface ProfileFormProps {
    page?: string;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ page }) => {
    const [file, setFile] = useState<File | null>(null);
    const [profileImage, setProfileImage] = useState('');
    const [croping, setCroping] = useState(false);
    const [zoom, setZoom] = useState(1.0);
    const [imageProfile, setImageProfile] = useState<File | undefined>();
    const {
        uploadedFiles,
        loadinguploadFiles,
        setUploadFileAsync,
        uploadProfileLoading,
    } = useFileUploadHandler('PROFILE', 'profile_image');

    const states = useAppStore();
    const router = useRouter();

    const {
        handleSubmit,
        register,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            firstname: '',
            lastname: '',
            email: '',
            phone: '',
            fullAddress: '',
            state: '',
            area: '',
            landmark: '',
            dob: '',
            gender: '',
            country: '',
        },
    });

    const editorRef = useRef<AvatarEditor>(null);
    const imgRef = useRef<HTMLInputElement>(null);

    const userType = useMemo(
        () => router.pathname.split('/')?.at(-1),
        [router]
    );
    const queryClient = useQueryClient();
    const createKycMutateKey = 'CREATEKYC';
    const updateUsermutate = 'UPDATEUSER';

    const {
        mutateAsync: createKycProfileAsync,
        isLoading: isCreateKycLoading,
    } = useMutation(createKycMutateKey, UserService.createKycProfile, {
        onSuccess: () => {
            queryClient.invalidateQueries(['getUserProfile']);
        },
    });

    const { mutateAsync: updateUser, isLoading } = useMutation(
        updateUsermutate,
        UserService.updateUser,
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['getUserProfile']);
            },
        }
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files as FileList;
        if (!fileList.length) return;
        setFile(fileList[0]);
        setCroping(true);
        setImageProfile(fileList[0]);
        // handleImageUpload(fileList[0]);
    };

    const onCrop = async () => {
        // Get the base64 URL of the cropped image
        let dataUrl: any = editorRef.current
            ?.getImageScaledToCanvas()
            .toDataURL();
        handleImageUpload(convertDataUrlToImageFile(dataUrl, imageProfile));
        setCroping(false);
    };

    const removeImg = () => {
        setProfileImage('');
        setFile(null);
        editorRef.current?.setState(null);
    };

    const handleImageUpload = (profileImg: File | undefined) => {
        // imgRef.current?.click();

        if (profileImg) {
            const formData = new FormData();
            formData.append(`doc1_docTypeID`, `14`);
            formData.append(`doc1_docNo`, `${generateRandomAlphanumeric()}`);
            formData.append(`doc1_description`, `Profile Images`);
            formData.append(`doc1_files`, profileImg);

            setUploadFileAsync(formData)
                .then((data) => {
                    console.log('upload result', data);
                })
                .catch((error) => {
                    toast.error('Not Sucessful. ', error.message);
                });
        }
    };

    const [selectedState, setSelectedState] = useState('');
    const [availableLgas, setAvailableLgas] = useState<string[]>([]);
    const [lgasLoading, setLgasLoading] = useState(false);
    const NigeriaState = watch('state');

    // Update LGAs when state changes or component mounts with user state
    useEffect(() => {
        const loadLgas = async () => {
            if (NigeriaState) {
                setLgasLoading(true);
                try {
                    const lgas = nigeriaStates.lgas(NigeriaState) || [];
                    setAvailableLgas(lgas);

                    // If the current area is not in the new state's LGAs, clear it
                    const currentArea = watch('area');
                    if (currentArea && !lgas.includes(currentArea)) {
                        setValue('area', '');
                    }
                } catch (error) {
                    console.error('Error loading LGAs:', error);
                    setAvailableLgas([]);
                } finally {
                    setLgasLoading(false);
                }
            }
        };

        const timer = setTimeout(() => {
            loadLgas();
        }, 0);

        return () => clearTimeout(timer);
    }, [NigeriaState, setValue, watch]);

    const onSubmit = async (data: any) => {
        data.dob = new Date(data.dob).toUTCString();

        console.log(data, 'data');

        // Add user image to the data
        if (profileImage) {
            data.profileImage = profileImage;
        }

        if (page && page === 'kyc') {
            data.accounttype = states?.activeKyc?.accountType;
            data.kycStage = 1;

            const formData = new FormData();
            for (const key in data) {
                formData.append(key, data[key]);
            }

            const formDataObj = Object.fromEntries(formData.entries());

            createKycProfileAsync(formDataObj)
                .then((res) => {
                    const newKycStage =
                        (res?.data?.currentKyc?.kycStage ?? 0) + 1;
                    states?.setActiveKyc(res?.data?.currentKyc);
                    states?.setStep(newKycStage);
                    states?.setScreen('');
                    states?.setStartKycScreen('');
                    toast.success('Profile updated.');
                })
                .catch((error) => {
                    console.log('error', error);
                    const errorMessage = (error as any)?.data?.message;
                    toast.error(errorMessage);
                });
        } else {
            updateUser(data)
                .then((req) => {
                    toast.success('Profile updated.');
                    console.log(req, 'req');
                })
                .catch((error) => {
                    console.log('error', error);
                    const errorMessage = (error as any)?.data?.message;
                    toast.error(errorMessage);
                });
        }
    };

    const setImgProfile = useCallback(async () => {
        if (uploadedFiles?.data?.data[0]?.urls.length) {
            const dataUrl = uploadedFiles?.data?.data[0]?.urls[0];
            console.log(dataUrl, 'dataUrl');

            // Update the state with the  image URL
            // const profileImg = await base64ToURL(dataUrl);
            setProfileImage(dataUrl);
        }
    }, [uploadedFiles?.data?.data]);

    useEffect(() => {
        const defaultValues = {
            firstname: states?.user?.firstname,
            lastname: states?.user?.lastname,
            email: states?.user?.email,
            phone: states?.user?.phone,
            state: states?.user?.state,
            area: states?.user?.area,
            country: states?.user?.country,
            dob: moment(states?.user?.dob).format('YYYY-MM-DD'),
            gender: states?.user?.gender,
            landmark: states?.user?.landmark,
            fullAddress: states?.user?.fullAddress,
        };

        Object.entries(defaultValues).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                setValue(key as keyof typeof defaultValues, value);
            }
        });

        // Initialize LGAs if user has a state
        if (states?.user?.state) {
            setSelectedState(states.user.state);
            // LGAs will be loaded by the main effect when NigeriaState updates
        }
    }, [states?.user, setValue]);

    useEffect(() => {
        setImgProfile();
    }, [setImgProfile]);

    return (
        <form
            className="grid grid-cols-2 gap-4 py-5"
            onSubmit={handleSubmit(onSubmit)}
        >
            <div className="col-span-2 flex flex-col justify-center items-center">
                {/* <h3 className="text-center font-semibold mb-2">
                    Upload a photo
                </h3> */}

                {croping && (
                    <div className="absolute z-20 bg-gray-400 p-4 mx-auto ">
                        <AvatarEditor
                            ref={editorRef}
                            image={file as File}
                            width={380}
                            height={380}
                            border={50}
                            borderRadius={200}
                            color={[256, 256, 256, 1]}
                            scale={zoom}
                            rotate={0}
                            disableHiDPIScaling
                        />
                        <div className="flex justify-between items-center">
                            <button
                                type="button"
                                onClick={onCrop}
                                className="bg-white px-4 py-2 rounded-2xl inline-block mt-2"
                            >
                                Save
                            </button>
                            <div className="w-[80px]">
                                <h4 className="text-white font-medium">
                                    Scale
                                </h4>
                                <input
                                    type="range"
                                    value={zoom}
                                    className="w-full in-range:border-gray-200"
                                    min="-1"
                                    step="0.1"
                                    max="2"
                                    onChange={(e) =>
                                        setZoom(parseFloat(e.target.value))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                )}
                <label
                    htmlFor="upload"
                    className="w-[150px] aspect-square bg-brand-gray-300 rounded-full relative flex justify-center items-center overflow-clip p-4 text-center hover:bg-opacity-70 hover:bg-black group"
                >
                    <span className="hidden absolute inset-[30px] top-[40px] flex items-center justify-center text-white group-hover:block">
                        CHANGE PROFILE PHOTO
                    </span>
                    <input
                        ref={imgRef}
                        id="upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="opacity-0 absolute top-0 bottom-0 right-0 left-0 z-10 cursor-pointer"
                    />
                    {!profileImage ? (
                        //
                        uploadProfileLoading || loadinguploadFiles ? (
                            <Spinner className="h-20 w-20" />
                        ) : (
                            <svg
                                width="44"
                                height="43"
                                viewBox="0 0 44 43"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M21.9998 0.166626C24.8288 0.166626 27.5419 1.29043 29.5423 3.29082C31.5427 5.29121 32.6665 8.00432 32.6665 10.8333C32.6665 13.6623 31.5427 16.3754 29.5423 18.3758C27.5419 20.3762 24.8288 21.5 21.9998 21.5C19.1709 21.5 16.4578 20.3762 14.4574 18.3758C12.457 16.3754 11.3332 13.6623 11.3332 10.8333C11.3332 8.00432 12.457 5.29121 14.4574 3.29082C16.4578 1.29043 19.1709 0.166626 21.9998 0.166626ZM21.9998 26.8333C33.7865 26.8333 43.3332 31.6066 43.3332 37.5V42.8333H0.666504V37.5C0.666504 31.6066 10.2132 26.8333 21.9998 26.8333Z"
                                    fill="#131313"
                                    fillOpacity="0.65"
                                />
                            </svg>
                        )
                    ) : (
                        <Image src={profileImage} alt="img" fill />
                    )}
                </label>
                {/* <div className="flex gap-5 mt-10">
                    <Button
                        type="button"
                        className="py-4 px-12"
                        onClick={handleImageUpload}
                    >
                        Upload a picture
                    </Button>
                    <Button
                        type="button"
                        onClick={removeImg}
                        className="!text-[#BB0707] !bg-[#FFEAEA] !border-0 py-4 px-12"
                    >
                        Delete
                    </Button>
                </div> */}
            </div>

            <Input
                label="First Name"
                required
                placeholder="First name"
                asterisk
                register={{ ...register('firstname') }}
                error={errors.firstname}
                inputClassName="bg-white"
            />
            <Input
                label="Last Name"
                required
                placeholder="Last name"
                asterisk
                register={{ ...register('lastname') }}
                error={errors.lastname}
                inputClassName="bg-white"
            />
            <Input
                label="Email Address"
                required
                placeholder="Email address"
                asterisk
                register={{ ...register('email') }}
                error={errors.email}
                readOnly
                inputClassName="cursor-not-allowed bg-white"
            />
            <Input
                label="Phone Number"
                required
                placeholder="Phone number"
                asterisk
                register={{ ...register('phone') }}
                error={errors.phone}
                inputClassName="bg-white"
            />
            <Select
                label="Gender"
                placeholder="Select gender"
                required
                register={{ ...register('gender') }}
                error={errors.gender}
                selectDivClassName="bg-white"
            >
                <option value="female">Female</option>
                <option value="male">Male</option>
            </Select>
            <Input
                type="date"
                label="Date of Birth"
                placeholder="DD/MM/YY"
                asterisk
                required
                value={watch('dob')}
                register={{ ...register('dob') }}
                error={errors.dob}
                inputClassName="bg-white"
            />
            <Select
                label="Country"
                placeholder="Country"
                required
                register={{ ...register('country') }}
                error={errors.country}
                selectDivClassName="bg-white"
            >
                <option value="nigeria">Nigeria</option>
            </Select>
            <Select
                label="State"
                placeholder="State"
                required
                register={{ ...register('state') }}
                error={errors.state}
                selectDivClassName="bg-white"
                onChange={(e) => {
                    const newState = e.target.value;
                    setValue('state', newState);
                    setValue('area', ''); // Clear LGA when state changes
                    setSelectedState(newState);
                    const lgas = nigeriaStates.lgas(newState) || [];
                    setAvailableLgas(lgas);
                }}
            >
                <option disabled value="">
                    State
                </option>
                {nigeriaStates.states().map((state: string, i: number) => (
                    <option key={i} value={state}>
                        {state}
                    </option>
                ))}
            </Select>
            <Select
                label="Local Government"
                placeholder="LGA"
                required
                register={{ ...register('area') }}
                error={errors.area}
                selectDivClassName="bg-white"
            >
                <option disabled value="">
                    Select LGA
                </option>
                {availableLgas.map((lga: string, i: number) => (
                    <option key={i} value={lga}>
                        {lga}
                    </option>
                ))}
            </Select>
            <Input
                label="Full Address"
                required
                placeholder="Address"
                asterisk
                register={{ ...register('fullAddress') }}
                error={errors.fullAddress}
                inputClassName="bg-white"
            />
            <Input
                label="Landmark"
                required
                placeholder="Landmark"
                register={{ ...register('landmark') }}
                error={errors.landmark}
                inputClassName="bg-white"
            />

            <Button
                isLoading={isLoading || isCreateKycLoading}
                loadingText="processing..."
                className="mx-auto col-span-2 py-4 w-2/5"
            >
                Update
            </Button>
        </form>
    );
};

export default ProfileForm;
