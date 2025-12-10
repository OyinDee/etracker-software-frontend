import Button from 'components/base/Button';
import Input from 'components/base/form/Input';
import { ChangeEvent, FC, useEffect, useMemo, useRef, useState } from 'react';
import { MdOutlineCancel } from 'react-icons/md';
import { useAppStore } from 'hooks/useAppStore';
import { toast } from 'react-hot-toast';
import useKycHandler from 'hooks/useKycHandler';
import { useRouter } from 'next/router';
import { UploadedFile } from 'interfaces';
import useFileUploadHandler from 'hooks/useFileUploadHandler';
import Loader from 'components/base/Loader';
import { CustomFile } from 'interfaces/CustomFile';

interface DocumentFormProps {
    page?: string;
}

export const DocumentUpload: FC<DocumentFormProps> = ({ page }) => {
    // track which required document index the user is currently uploading
    const [currentIndex, setCurrentIndex] = useState(0);
    const [idNumber, setIdNumber] = useState('');
    const [files, setFiles] = useState<CustomFile[]>([]);
    const [showError, setShowError] = useState(false);
    const [showMessage, setShowMessage] = useState('');
    const [handleFileChangeCalled, setHandleFileChangeCalled] = useState(false);

    const imageRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const states = useAppStore();

    // Ensure activeAccount is set if not already
    useEffect(() => {
        if (!states?.activeAccount) {
            if (states?.user?.accountTypes?.length) {
                console.log(
                    'DocumentUpload: Setting active account from user account types'
                );
                states?.setActiveAccount(states.user.accountTypes[0]);
            } else if (states?.activeKyc?.accountType) {
                console.log('DocumentUpload: Setting active account from KYC');
                states?.setActiveAccount(states.activeKyc.accountType);
            } else {
                console.log('DocumentUpload: No account type available');
            }
        }
    }, [
        states?.activeAccount,
        states?.user?.accountTypes,
        states?.activeKyc?.accountType,
        states,
    ]);

    const { kycHandler, isLoading, fileTypes, loadingFileType } = useKycHandler(
        'document_upload',
        'KYC',
        states?.activeAccount
    );

    const { uploadedFiles, loadinguploadFiles } = useFileUploadHandler(
        'KYC',
        'document_upload'
    );

    // We'll compute the list of required documents below and select the current one by index

    // Handle loading and error states
    const isLoadingData = loadingFileType || loadinguploadFiles;
    const hasError =
        !isLoadingData &&
        (!fileTypes?.data?.data?.length || !states?.activeAccount);

    const clearData = () => {
        setIdNumber('');
    };

    const onPickImage = () => {
        const selectedDoc = getRequiredDocuments[currentIndex];
        if (!selectedDoc) return;
        if (selectedDoc?.askForDocID === 1 && !idNumber) {
            setShowError(true);
            return;
        }
        imageRef.current?.click();
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files as FileList;
        if (!fileList || fileList.length === 0) return;

        // Check if file is an image
        const file = fileList[0];
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file only (JPG, PNG, etc.)');
            return;
        }

        // Check file size - limit to 1MB (1,048,576 bytes)
        const maxSizeInBytes = 1024 * 1024; // 1MB
        if (file.size > maxSizeInBytes) {
            toast.error(
                'Image size must be under 1MB. Please select a smaller image.'
            );
            return;
        }

        const preview = URL.createObjectURL(fileList[0]);

        const selectedDoc = getRequiredDocuments[currentIndex];
        if (!selectedDoc) return;

        const DocPayload = {
            blob: fileList[0],
            preview,
            idType: selectedDoc.name,
            id: selectedDoc?.typeID,
            idNumber,
            typeID: selectedDoc.typeID,
            description: selectedDoc.description,
            url: '',
        } as any;

        // Replace if already exists otherwise append
        const existingDocIndex = files.findIndex(
            (file) => Number(file.typeID) === Number(selectedDoc.typeID)
        );
        let updatedFiles: any[] = [];
        if (existingDocIndex !== -1) {
            updatedFiles = [...files];
            updatedFiles.splice(existingDocIndex, 1, DocPayload);
        } else {
            updatedFiles = [...files, DocPayload];
        }

        setFiles(updatedFiles);
        clearData();
        setHandleFileChangeCalled(true); // prevent overwriting from uploadedFiles effect
    };

    const removeFile = (id: number) => {
        const filtered = files.filter((el) => el.typeID !== id);
        setFiles(filtered);
        setHandleFileChangeCalled(true);

        // move the current index to the removed document so user can re-upload if needed
        const docIndex = getRequiredDocuments.findIndex(
            (d) => Number(d.typeID) === Number(id)
        );
        if (docIndex !== -1) setCurrentIndex(docIndex);
    };

    const getRequiredDocuments = useMemo(() => {
        if (!fileTypes?.data?.data) {
            console.log('DocumentUpload: No file types data available');
            return [];
        }
        if (!states?.activeAccount) {
            console.log('DocumentUpload: No active account set');
            return [];
        }

        const filtered = fileTypes.data.data.filter(
            (fileType) =>
                fileType.requiredFor.includes(Number(states?.activeAccount)) &&
                fileType.typeID
        );

        console.log(
            'DocumentUpload: Required documents found:',
            filtered.length
        );
        return filtered;
    }, [fileTypes, states?.activeAccount]);

    // the currently selected required document the user should upload
    const selectedDoc = useMemo(() => {
        return getRequiredDocuments[currentIndex] ?? null;
    }, [getRequiredDocuments, currentIndex]);

    const validateRequiredFiles = () => {
        const requiredDocs = getRequiredDocuments;
        const missingDocs = requiredDocs.filter(
            (doc) =>
                !files.some((file) => Number(file?.id) === Number(doc.typeID))
        );
        return missingDocs;
    };

    const onHandleUpload = () => {
        const missingDocs = validateRequiredFiles();
        if (missingDocs.length > 0) {
            const missingDocNames = missingDocs
                .map((doc) => doc.name)
                .join(', ');
            const errorMessage = `Please upload the following required documents: ${missingDocNames}`;
            toast.error(errorMessage);
            setShowMessage(errorMessage);
            return;
        }

        setShowMessage('');
        const formData = new FormData();
        // Ensure there is at least one new file to upload
        const filteredFiles = files.filter((file: CustomFile) => {
            return !file?.url;
        });

        if (!filteredFiles.length) {
            toast.error('No file selected');
            return;
        }

        filteredFiles.forEach((file, i) => {
            formData.append(`doc${i + 1}_docTypeID`, `${file.typeID}`);
            formData.append(`doc${i + 1}_docNo`, `${file.idNumber}`);
            formData.append(`doc${i + 1}_description`, `${file.description}`);
            formData.append(`doc${i + 1}_files`, file.blob);
        });
        formData.append('accountType', String(states?.activeKyc?.accountType)); // Convert to string
        formData.append('kycStage', '2'); // Convert to string
        const res = kycHandler(formData)
            .then((res) => {
                console.log('response>>>', res);
                const newKycStage = res?.data?.currentKyc?.kycStage + 1;
                res.data.currentKyc.kycStage = newKycStage;
                states?.setUser({ user: res?.data });
                states?.setActiveKyc(res?.data?.currentKyc);
                states?.setKycStage(newKycStage);
                states?.setStep(newKycStage);
                states?.setStartKycScreen('');
                if (states?.activeAccount === 1) {
                    states?.setScreen('kycCompleted');
                    router.push('/dashboard/properties');
                } else {
                    states?.setScreen('');
                    toast.success('KYC document uploaded.');
                }
                setHandleFileChangeCalled(false);
            })
            .catch((error) => {
                toast.error('Not Sucessful. ', error.message);
            });
    };

    const createFileList = (fileName: string): FileList => {
        const file = new File([], fileName, {
            type: 'application/octet-stream',
        }); // Create an empty file with the given file name
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        return dataTransfer.files;
    };

    useEffect(() => {
        const uploadDocLength = uploadedFiles?.data?.data.length;
        if (!handleFileChangeCalled && uploadDocLength) {
            const docFiles: UploadedFile[] = uploadedFiles?.data?.data;
            const updatedDocs: any[] = [];

            docFiles.forEach((doc) => {
                if (doc?.files && doc?.files.length > 0) {
                    const fileList = createFileList(doc.files[0]);
                    const preview = URL.createObjectURL(fileList[0]);
                    const updatedDoc = {
                        blob: fileList[0],
                        preview,
                        idType: doc?.description,
                        id: doc?.docTypeID,
                        idNumber: doc?.docNo,
                        typeID: doc?.docTypeID,
                        description: doc?.description,
                        url: doc?.urls[0],
                    };

                    const existingDocIndex = files.findIndex(
                        (file) => file.id === doc.docTypeID
                    );
                    if (existingDocIndex !== -1) {
                        const updatedFiles = [...files];
                        updatedFiles.splice(existingDocIndex, 1, updatedDoc); // Replace existing object
                        setFiles(updatedFiles);
                    } else {
                        updatedDocs.push(updatedDoc);
                    }
                }
            });

            setFiles((prevFiles) => [...prevFiles, ...updatedDocs]);
            setHandleFileChangeCalled(false); // Reset the flag after useEffect runs
        }
    }, [uploadedFiles, handleFileChangeCalled, states?.step, files]);

    return (
        <section className="h-screen py-18 mt-20">
            {isLoadingData ? (
                <div className="flex flex-col justify-center items-center h-64">
                    <Loader loading={true} />
                    <span className="ml-2 text-gray-600">
                        Loading required documents...
                    </span>
                    <p className="text-sm text-gray-500 mt-2">
                        Please wait while we prepare your document upload
                        options
                    </p>
                </div>
            ) : hasError ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <p className="font-semibold mb-2">
                        Unable to Load Document Upload
                    </p>
                    <p>
                        {!states?.activeAccount
                            ? 'Account type not found. Please refresh the page or go back and try again.'
                            : 'Failed to load document types. Please refresh the page or try again later.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="mb-10 p-4 bg-gray-50 rounded-lg">
                        <h2 className="font-semibold text-lg mb-4">
                            📋 Select Document to Upload
                            {getRequiredDocuments.length > 0 && (
                                <span className="ml-2 text-sm font-normal text-green-600 bg-green-100 px-2 py-1 rounded">
                                    {getRequiredDocuments.length} documents
                                    required
                                </span>
                            )}
                        </h2>
                        {getRequiredDocuments.length === 0 ? (
                            <div className="text-center py-8 bg-white rounded border border-orange-200">
                                <div className="text-4xl mb-4">📄</div>
                                <p className="text-gray-700 font-medium mb-2">
                                    Document types are loading...
                                </p>
                                <p className="text-sm text-gray-500">
                                    {!states?.activeAccount
                                        ? 'Setting up your account profile...'
                                        : 'Fetching required documents for your account type...'}
                                </p>
                                <Button
                                    type="button"
                                    variant="default"
                                    className="mt-4"
                                    onClick={() => window.location.reload()}
                                >
                                    Refresh Page
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {getRequiredDocuments.map((doc, index) => {
                                    const isUploaded = files.some(
                                        (file) =>
                                            Number(file?.id) ===
                                            Number(doc.typeID)
                                    );
                                    const isSelected = currentIndex === index;
                                    return (
                                        <div
                                            key={doc.id}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : isUploaded
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'border-gray-300 bg-white hover:border-gray-400'
                                            }`}
                                            onClick={() =>
                                                setCurrentIndex(index)
                                            }
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center mb-2">
                                                        <span
                                                            className={`w-6 h-6 mr-3 flex items-center justify-center rounded-full text-sm font-medium ${
                                                                isUploaded
                                                                    ? 'bg-green-500 text-white'
                                                                    : isSelected
                                                                    ? 'bg-blue-500 text-white'
                                                                    : 'bg-gray-200 text-gray-600'
                                                            }`}
                                                        >
                                                            {isUploaded
                                                                ? '✓'
                                                                : index + 1}
                                                        </span>
                                                        <h3
                                                            className={`font-medium ${
                                                                isSelected
                                                                    ? 'text-blue-700'
                                                                    : 'text-gray-800'
                                                            }`}
                                                        >
                                                            {doc.name}
                                                        </h3>
                                                    </div>
                                                    <p className="text-sm text-gray-600 ml-9">
                                                        {doc.description}
                                                        {doc.askForDocID ===
                                                            1 &&
                                                            ' (ID number required)'}
                                                    </p>
                                                </div>
                                                {isSelected && (
                                                    <div className="ml-2 text-blue-500">
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            {isUploaded && (
                                                <div className="mt-2 text-sm text-green-600 font-medium">
                                                    ✓ Uploaded
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {!!showMessage && (
                        <div className="rounded-md py-4 px-6 bg-red-100 border border-red-200 text-red-700 mb-6 flex justify-between items-center">
                            <p className="flex-1">{showMessage}</p>
                            <button
                                onClick={() => setShowMessage('')}
                                className="text-red-700 hover:text-red-900"
                                aria-label="Close error message"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                    <div className="mb-10 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h2 className="font-semibold text-blue-800 mb-3">
                            📸 Upload Document Images
                        </h2>
                        <p className="text-blue-700 mb-3">
                            Please take clear photos or scan images of your
                            documents. We only accept image files (JPG, PNG,
                            etc.) under 1MB.
                        </p>
                        <ul className="list-disc ml-5 text-blue-700">
                            <li>
                                A clear image of your NIN, International
                                passport, Voter&apos;s card or Driver&apos;s
                                license
                            </li>
                            <li>An image of your utility bill</li>
                        </ul>
                        <p className="text-sm text-blue-600 mt-2">
                            💡 Tip: Ensure documents are well-lit and all text
                            is clearly readable
                        </p>
                    </div>
                    <section className="lg:w-4/6 mr-auto">
                        <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
                            <h3 className="font-semibold text-lg mb-4">
                                {selectedDoc
                                    ? `Uploading: ${selectedDoc.name}`
                                    : 'Select a document type above to upload'}
                            </h3>
                            {selectedDoc ? (
                                <div>
                                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                                        <p className="text-blue-800 font-medium">
                                            Ready to Upload: {selectedDoc.name}
                                        </p>
                                        <p className="text-sm text-blue-600 mt-1">
                                            {selectedDoc.description}
                                        </p>
                                    </div>
                                    {selectedDoc?.askForDocID === 1 && (
                                        <div className="mb-4">
                                            <Input
                                                placeholder="Enter ID number"
                                                className="bg-white"
                                                inputClassName="bg-white"
                                                value={idNumber}
                                                onChange={(e) =>
                                                    setIdNumber(e.target.value)
                                                }
                                                onFocus={() =>
                                                    setShowError(false)
                                                }
                                                error={
                                                    showError && {
                                                        message:
                                                            'Number on ID is required',
                                                    }
                                                }
                                            />
                                        </div>
                                    )}
                                    <div className="flex gap-4">
                                        <input
                                            ref={imageRef}
                                            type="file"
                                            accept="image/*"
                                            className="opacity-0 invisible w-1"
                                            onChange={handleFileChange}
                                        />
                                        <Button
                                            type="button"
                                            className="px-6 py-2"
                                            onClick={onPickImage}
                                        >
                                            {files.some(
                                                (f) =>
                                                    Number(f.typeID) ===
                                                    Number(selectedDoc.typeID)
                                            )
                                                ? 'Replace Image'
                                                : 'Upload Image'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500">
                                    Click on any document type above to start
                                    uploading.
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col flex-1 mt-5 min-h-[200px] pb-10 bg-white rounded-md border border-gray-300">
                            {loadinguploadFiles ? (
                                <Loader loading={loadinguploadFiles} />
                            ) : (
                                (!!files.length &&
                                    files.map((file, index) => {
                                        return (
                                            <div
                                                key={index}
                                                className="flex items-center py-2 px-4 bg-gray-200 border border-gray-300 mb-1"
                                            >
                                                <div className="w-full">
                                                    <h3 className="font-semibold">
                                                        {file?.idType}
                                                    </h3>
                                                    <p className="">{`${file?.idNumber}`}</p>
                                                    <p className="">{`${file.blob?.name}`}</p>
                                                </div>
                                                <div className="inline-flex items-center gap-4">
                                                    <a
                                                        href={file.preview}
                                                        target="_blank"
                                                        title="preview"
                                                        type="button"
                                                        className="text-primary-600 font-medium"
                                                    >
                                                        Preview
                                                    </a>
                                                    <button
                                                        onClick={() =>
                                                            removeFile(
                                                                file.typeID
                                                            )
                                                        }
                                                        className="w-8 h-8 text-brand-red"
                                                        title="Remove"
                                                    >
                                                        <MdOutlineCancel />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })) || (
                                    <p className="m-auto text-center opacity-60 mt-40">
                                        No File Added
                                    </p>
                                )
                            )}
                        </div>
                    </section>
                    <div className="mr-auto w-4/6 mt-40">
                        <div className="flex gap-5 justify-center">
                            <Button
                                type="button"
                                onClick={states?.goBack}
                                variant="default"
                                className="w-full lg:w-1/3 py-4"
                            >
                                Previous
                            </Button>
                            <Button
                                isLoading={isLoading}
                                loadingText="uploading files..."
                                onClick={onHandleUpload}
                                className="w-full lg:w-1/3 py-4"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
};

export default DocumentUpload;
