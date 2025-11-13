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
        if (!states?.activeAccount && states?.user?.accountTypes?.length) {
            states?.setActiveAccount(states.user.accountTypes[0]);
        }
    }, [states?.activeAccount, states?.user?.accountTypes, states]);

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
    const hasError = !isLoadingData && !fileTypes?.data?.data?.length;

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

        // Check file size - limit to 1MB (1,048,576 bytes)
        const maxSizeInBytes = 1024 * 1024; // 1MB
        if (fileList[0].size > maxSizeInBytes) {
            toast.error(
                'File size must be under 1MB. Please select a smaller file.'
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

        // auto-advance to next missing required document
        const nextMissingIndex = getRequiredDocuments.findIndex(
            (doc) =>
                !updatedFiles.some(
                    (f) => Number(f.typeID) === Number(doc.typeID)
                )
        );
        if (nextMissingIndex === -1) {
            // all uploaded
            setCurrentIndex(getRequiredDocuments.length);
        } else {
            setCurrentIndex(nextMissingIndex);
        }
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
        if (!fileTypes?.data?.data) return [];
        return fileTypes.data.data.filter(
            (fileType) =>
                fileType.requiredFor.includes(Number(states?.activeAccount)) &&
                fileType.typeID
        );
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
                <div className="flex justify-center items-center h-64">
                    <Loader loading={true} />
                    <span className="ml-2">Loading document types...</span>
                </div>
            ) : hasError ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    Failed to load document types. Please try again later.
                </div>
            ) : (
                <>
                    <div className="mb-10 p-4 bg-gray-50 rounded-lg">
                        <h2 className="font-semibold text-lg mb-4">
                            Required Documents
                        </h2>
                        <ul className="space-y-2">
                            {getRequiredDocuments.map((doc) => {
                                const isUploaded = files.some(
                                    (file) =>
                                        Number(file?.id) === Number(doc.typeID)
                                );
                                return (
                                    <li
                                        key={doc.id}
                                        className="flex items-center"
                                    >
                                        <span
                                            className={`w-5 h-5 mr-2 flex items-center justify-center rounded-full ${
                                                isUploaded
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-200'
                                            }`}
                                        >
                                            {isUploaded
                                                ? '✓'
                                                : getRequiredDocuments.indexOf(
                                                      doc
                                                  ) + 1}
                                        </span>
                                        <span
                                            className={
                                                isUploaded
                                                    ? 'text-gray-500 line-through'
                                                    : ''
                                            }
                                        >
                                            {doc.name}{' '}
                                            {doc.askForDocID === 1
                                                ? '(with ID number)'
                                                : ''}
                                        </span>
                                        {isUploaded && (
                                            <span className="ml-2 text-sm text-green-600">
                                                (Uploaded)
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
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
                    <ul className="list-disc mb-10 ml-5">
                        <h2 className="font-semibold -ml-5">
                            You are required to submit these documents
                        </h2>
                        <li>
                            A copy of your NIN, International passport,
                            Voter&apos;s card or Driver&apos;s license{' '}
                        </li>
                        <li>Your utility bill</li>
                    </ul>
                    <section className="lg:w-4/6 mr-auto">
                        <div className="flex gap-5 items-start">
                            <div className="flex-1">
                                <div className="p-4 bg-white rounded border">
                                    <h3 className="font-semibold">
                                        {selectedDoc
                                            ? selectedDoc.name
                                            : 'All required documents uploaded'}
                                    </h3>
                                    {selectedDoc && (
                                        <p className="text-sm text-gray-600 mt-2">
                                            {selectedDoc.description}
                                        </p>
                                    )}
                                    {selectedDoc?.askForDocID === 1 && (
                                        <Input
                                            placeholder="Enter ID number"
                                            className="bg-white mt-3"
                                            inputClassName="bg-white"
                                            value={idNumber}
                                            onChange={(e) =>
                                                setIdNumber(e.target.value)
                                            }
                                            onFocus={() => setShowError(false)}
                                            error={
                                                showError && {
                                                    message:
                                                        'Number on ID is required',
                                                }
                                            }
                                        />
                                    )}
                                </div>
                            </div>
                            <input
                                ref={imageRef}
                                type="file"
                                accept={selectedDoc?.expectedMimes
                                    ?.map((mime: string) => `.${mime}`)
                                    .join(',')}
                                className="opacity-0 invisible w-1"
                                onChange={handleFileChange}
                            />
                            <Button
                                type="button"
                                disabled={!selectedDoc}
                                className="relative mt-3 disabled:bg-blue-500"
                                onClick={onPickImage}
                            >
                                Upload File
                            </Button>
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
