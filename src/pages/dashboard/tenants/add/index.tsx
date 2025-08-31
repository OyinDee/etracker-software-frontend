import BackButton from 'components/base/BackButton';
import Button from 'components/base/Button';
import { DialogModal } from 'components/base/DialogModal';
import SearchResult from 'components/base/SearchResult';
import useAccountType from 'hooks/useAccountType';
import { useAppStore } from 'hooks/useAppStore';
import { Property, User } from 'interfaces';
// import Image from 'next/image';
import { useRouter } from 'next/router';
import Dashboard from '..';
import React, { useEffect, useRef, useState } from 'react';
import { goBackToKyc2 } from 'utils/helper';
import toast from 'react-hot-toast';
import useLandlord from 'hooks/useLandlord';
import { UserService } from 'services';
// import { string } from 'yup';
import Select from 'components/base/form/Select';
import useProperty from 'hooks/useProperty';
import TenantSearchItem from 'components/dashboard/tenants/add/SearchItem';
import { useQuery } from 'react-query';
import { inviteTenant } from 'services/newServices/tenant';
import { getSubscriptionStatus } from 'utils/subscriptionUtils';

export default function AddTenant() {
    const states = useAppStore();
    const { acctType } = useAccountType();
    const [openModal, setOpenModal] = useState<boolean>(false);
    const modalRef = useRef<any>(null);
    const router = useRouter();
    const { getMyProperties } = useProperty();
    const id = router.query.q as string;
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [link, setLink] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    // console.log(states?.propertyId, 'selectedPropertyId');
    const [selectedTenants, setSelectedTenants] = useState<User[]>([]);
    const [tenantDropdownItems, setTenantDropdownItems] = useState<User[]>([]);

    const { getLandlordTenants, addLandlordTenant, isAddTenantLoading } =
        useLandlord();

    const properties = getMyProperties?.data.data.map((property) => ({
        value: property.id,
        label: property.name,
    }));

    const { data: userProfile } = useQuery(
        'getUserProfile',
        UserService.getUser,
        {}
    );

    // const createRegistrationLink = (invitedByName: string) => {
    //     return `localhost:3000/auth/invite-tenant?invitedBy=${encodeURIComponent(
    //         invitedByName
    //     )}`;
    // };

    // useEffect(() => {
    //     const firstname: string = userProfile?.firstname || '';
    //     const lastname: string = userProfile?.lastname || '';

    //     const invitedByName: string = `${firstname} ${lastname}`;

    // // const createRegistrationLink = (propertyId: string) => {
    // //     return `https://etracker-software-frontend.vercel.app/auth/signup?propertyId=${propertyId}`;
    // // };

    useEffect(() => {
        let propId;
        if (id) {
            propId = id;
        } else if (selectedPropertyId) {
            propId = selectedPropertyId;
        } else if (states?.propertyId) {
            propId = states?.propertyId;
        }

        const firstname: string = userProfile?.firstname || '';
        const lastname: string = userProfile?.lastname || '';
        const invitedByName: string = `${firstname} ${lastname}`;
        const userId = userProfile?.id || ''; // Assuming the user ID is stored in userProfile

        const registrationLink = `https://etracker-software-frontend-five.vercel.app/auth/invite-tenant?propertyId=${propId}&invitedBy=${encodeURIComponent(
            invitedByName
        )}&userId=${userId}`; // Include userId in the link

        setLink(registrationLink);
    }, [userProfile, selectedPropertyId, id, states?.propertyId]);

    const handleClickOutside = (event: MouseEvent) => {
        if (
            modalRef.current &&
            !modalRef.current.contains(event.target as Node)
        ) {
            setOpenModal(false);
        }
    };

    const handleSearchTermChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setSearchTerm(event.target.value);
    };

    const handleTenantSelect = (item: User) => {
        // Check if the item with the same id already exists in the selectedItems array
        const isExisting = selectedTenants.some(
            (selectedItem: User) => selectedItem.id === item.id
        );
        if (!isExisting) {
            setSelectedTenants((prevItems: User[]) => [...prevItems, item]);
            // setSearchTerm('');
        }
    };

    const handleRemoveTenant = (item: User) => {
        // if (!isExisting) {
        setSelectedTenants((prevItems: User[]) =>
            prevItems.filter((prevItem) => prevItem.id !== item.id)
        );

        // }
    };
    // @ts-ignore
    const handleEmailChange = (event) => {
        setEmail(event.target.value);
    };

    const handleInviteTenant = async () => {
        const subscriptionStatus = await getSubscriptionStatus(
            states?.user?.email || ''
        );

        if (subscriptionStatus !== 'active') {
            toast.error(
                'You need an active subscription to perform this action.'
            );
            return;
        }

        try {
            setLoading(true);
            let propId;
            if (id) {
                propId = id;
            } else if (selectedPropertyId) {
                propId = selectedPropertyId;
            } else if (states?.propertyId) {
                propId = states?.propertyId;
            }
            // @ts-ignore
            const propertyId: string = propId;
            const userId = userProfile?.id || ''; // Assuming the user ID is stored in userProfile
            // @ts-ignore
            const selectedPropertyLabel = properties.find(
                (property) => property.value === propertyId
            )?.label;

            if (!propId || !email) {
                throw new Error('No property selected or email is missing');
            }

            const body = {
                propertyId: propId,
                email,
                propertyName: selectedPropertyLabel,
                invitedBy: userProfile?.firstname + ' ' + userProfile?.lastname,
                userId: userId,
            };

            const response = await inviteTenant(body);

            if (response) {
                toast.success('Invite sent successfully');
            } else {
                toast.error('Failed to send invite');
            }

            setLoading(false);
            setOpenModal(false);
        } catch (error) {
            console.error('Error inviting tenant:', error);
            toast.error('Error inviting tenant');
            setLoading(false);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && searchTerm.trim() !== '') {
            const fetchTenantDropdownItems = async () => {
                const response: any = await getLandlordTenants(
                    searchTerm.trim()
                );

                setSelectedTenants((prevItems: any) => {
                    const newItems = response?.data.filter((item: any) => {
                        // Check if the tenant with the same id already exists in the selectedItems array
                        return !prevItems.some(
                            (selectedTenant: any) =>
                                selectedTenant.id === item.id
                        );
                    });

                    return [...prevItems, ...newItems];
                });
            };

            return fetchTenantDropdownItems();
        }
    };

    useEffect(() => {
        if (searchTerm !== '') {
            // Simulating an API call to fetch dropdown items based on the search term
            const fetchTenantDropdownItems = async () => {
                const response: any = await getLandlordTenants(
                    searchTerm.trim()
                );
                setTenantDropdownItems(response?.data || []);
            };

            fetchTenantDropdownItems();
        }
    }, [searchTerm, getLandlordTenants]);

    const handleAddTenant = () => {
        let propId;
        if (id) {
            propId = id;
        } else if (selectedPropertyId) {
            propId = selectedPropertyId;
        } else if (states?.propertyId) {
            propId = states?.propertyId;
        }
        // @ts-ignore
        const propertyId: string = propId;

        if (!propertyId) {
            toast.error('No property selected');
            return;
        }

        if (propertyId) {
            if (!selectedTenants?.length) {
                toast.error('Empty tenant list');
                return;
            }
            const newSelectedTenants = selectedTenants.map((selectedTenant) => {
                return {
                    email: selectedTenant?.email,
                    propertyId,
                };
            });

            addLandlordTenant(newSelectedTenants)
                .then((res: any) => {
                    if (res) toast.success(res?.message);
                    setSelectedPropertyId('');
                    setSelectedTenants([]);
                    setTenantDropdownItems([]);
                    setSearchTerm('');
                })
                .catch((error) => {
                    toast.error(error.message);
                });
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleCopyLink = () => {
        let propId;
        if (id) {
            propId = id;
        } else if (selectedPropertyId) {
            propId = selectedPropertyId;
        } else if (states?.propertyId) {
            propId = states?.propertyId;
        }

        const firstname: string = userProfile?.firstname || '';
        const lastname: string = userProfile?.lastname || '';

        const invitedByName: string = `${firstname} ${lastname}`;

        // @ts-ignore
        const propertyId = propId;
        console.log(propertyId, 'propertyId');
        const link = `https://etracker-software-frontend-five.vercel.app/auth/invite-tenant?propertyId=${propertyId}&invitedBy=${encodeURIComponent(
            invitedByName
        )}`;
        navigator.clipboard
            .writeText(link)
            .then(() => {
                toast.success('Link copied');
            })
            .catch((err) => {
                toast.error(err.message);
            });
    };

    return (
        <div className="">
            <header className="flex justify-between">
                <div className="flex gap-4 items-center">
                    <BackButton />
                    <h3 className="text-sm lg:text-2xl font-medium text-black">
                        Add Tenant{' '}
                        {/* <span className="text-[0.8em] text-gray-500">
                            ({acctType?.accountType})
                        </span> */}
                    </h3>
                </div>

                <div className="flex gap-4 items-center">
                    <Button
                        title="Invite Tenant"
                        className="md:px-[10px] lg:px-[40px] md:py-2 lg:py-3 flex lg:gap-4 items-center"
                        onClick={() => {
                            const isUserVerify = goBackToKyc2(states, router);
                            // if (!selectedPropertyId) {
                            //     toast.error('Please go back and select a property');
                            //     return;
                            // }

                            if (!isUserVerify) {
                                toast.error('Please verify your account first');
                                return;
                            }
                            if (isUserVerify) {
                                setOpenModal(true);
                            }
                        }}
                    >
                        <svg
                            width="25"
                            height="14"
                            viewBox="0 0 25 14"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M19.4814 12V14H7.48145V12C7.48145 12 7.48145 8 13.4814 8C19.4814 8 19.4814 12 19.4814 12ZM16.4814 3C16.4814 2.40666 16.3055 1.82664 15.9759 1.33329C15.6462 0.839943 15.1777 0.455426 14.6295 0.228363C14.0813 0.00129986 13.4781 -0.0581102 12.8962 0.0576455C12.3142 0.173401 11.7797 0.459123 11.3601 0.878681C10.9406 1.29824 10.6548 1.83279 10.5391 2.41473C10.4233 2.99667 10.4827 3.59987 10.7098 4.14805C10.9369 4.69623 11.3214 5.16477 11.8147 5.49441C12.3081 5.82405 12.8881 6 13.4814 6C14.2771 6 15.0402 5.68393 15.6028 5.12132C16.1654 4.55871 16.4814 3.79565 16.4814 3ZM19.6814 8.06C20.2281 8.5643 20.6688 9.17244 20.9778 9.84891C21.2869 10.5254 21.4581 11.2566 21.4814 12V14H24.4814V12C24.4814 12 24.4814 8.55 19.6814 8.06ZM18.4814 1.1415e-06C18.1793 0.000181955 17.879 0.0474144 17.5914 0.140001C18.1765 0.97897 18.4902 1.97718 18.4902 3C18.4902 4.02282 18.1765 5.02103 17.5914 5.86C17.879 5.95259 18.1793 5.99982 18.4814 6C19.2771 6 20.0402 5.68393 20.6028 5.12132C21.1654 4.55871 21.4814 3.79565 21.4814 3C21.4814 2.20435 21.1654 1.44129 20.6028 0.878681C20.0402 0.316072 19.2771 1.1415e-06 18.4814 1.1415e-06ZM8.48145 5H5.48145V2H3.48145V5H0.481445V7H3.48145V10H5.48145V7H8.48145V5Z"
                                fill="white"
                            />
                        </svg>
                        <span className="sm:text-sm">Invite Tenant</span>
                    </Button>
                </div>
            </header>
            <main className="w-full bg-white my-10 rounded-md p-10">
                <section className="flex flex-col w-3/5">
                    <h3 className="font-bold text-xl py-3 text-[#131313]">
                        Tenant Information
                    </h3>
                    <p className=" text-[rgba(19,19,19,0.5)]">
                        Select the tenant from the dropdown menu. If your tenant
                        is connected with you, the property will be
                        automatically shared with them.
                    </p>
                </section>
                <section className="w-full">
                    <div className="lg:w-3/5 m-auto my-[50px]">
                        <section>
                            {id && (
                                <div className="mb-8">
                                    <Select
                                        label="Property"
                                        placeholder="Select property"
                                        required
                                        selectDivClassName="bg-white rounded-xl placeholder:text-[#13131373] focus:border-primary-600 border border-[#B9B9B9] p-0"
                                        labelClassName="!text-base !text-[#131313]"
                                        value={selectedPropertyId}
                                        onChange={(
                                            e: React.ChangeEvent<HTMLSelectElement>
                                        ) =>
                                            setSelectedPropertyId(
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option key="" value="">
                                            Select Property
                                        </option>
                                        {properties?.map((property) => (
                                            <option
                                                key={property.value}
                                                value={property.value}
                                            >
                                                {property.label}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            )}

                            <div>
                                <label className="text-base text-[#131313]">
                                    Tenants
                                    <span className="text-red-300">*</span>
                                </label>
                                <div className="relative w-full 4xl:h-3/5 mt-3">
                                    <svg
                                        className="absolute top-[25%] left-5"
                                        width="25"
                                        height="25"
                                        viewBox="0 0 25 25"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M22.2314 21.1895L16.5674 15.5255C17.9285 13.8914 18.6072 11.7956 18.4624 9.67389C18.3176 7.55219 17.3603 5.56801 15.7898 4.1341C14.2193 2.7002 12.1565 1.92697 10.0304 1.97528C7.90429 2.02359 5.87867 2.88971 4.37492 4.39347C2.87116 5.89723 2.00503 7.92284 1.95672 10.0489C1.90842 12.175 2.68164 14.2379 4.11555 15.8084C5.54945 17.3789 7.53364 18.3361 9.65534 18.481C11.777 18.6258 13.8729 17.9471 15.5069 16.586L21.1709 22.25L22.2314 21.1895ZM3.48141 10.25C3.48141 8.91494 3.87729 7.6099 4.61899 6.49987C5.36069 5.38983 6.4149 4.52467 7.6483 4.01378C8.8817 3.50289 10.2389 3.36921 11.5483 3.62966C12.8576 3.89011 14.0604 4.53299 15.0044 5.47699C15.9484 6.421 16.5913 7.62373 16.8517 8.9331C17.1122 10.2425 16.9785 11.5997 16.4676 12.8331C15.9567 14.0665 15.0915 15.1207 13.9815 15.8624C12.8715 16.6041 11.5664 17 10.2314 17C8.44181 16.998 6.72607 16.2862 5.46063 15.0207C4.19519 13.7553 3.4834 12.0396 3.48141 10.25Z"
                                            fill="#131313"
                                            fillOpacity="0.45"
                                        />
                                    </svg>

                                    <input
                                        type="search"
                                        placeholder="Search Tenant"
                                        className="rounded-xl bg-[#FFFFFF] placeholder:text-[#13131373] w-full pl-16 pr-4 py-3 focus:border-primary-600 border border-[#B9B9B9]"
                                        value={searchTerm}
                                        onChange={handleSearchTermChange}
                                        onKeyDown={handleKeyDown}
                                    />
                                </div>
                            </div>
                            {searchTerm !== '' && (
                                <div>
                                    <ul className="flex flex-col bg-gray-100">
                                        {Array.isArray(tenantDropdownItems) &&
                                            tenantDropdownItems.length > 0 &&
                                            tenantDropdownItems.map(
                                                (item: User) => (
                                                    <li
                                                        key={item?.id}
                                                        onClick={() =>
                                                            handleTenantSelect(
                                                                item
                                                            )
                                                        }
                                                        className="border-b p-3 text-gray-500 cursor-pointer"
                                                    >
                                                        {item?.firstname}
                                                        {'  '}
                                                        {item?.lastname}
                                                    </li>
                                                )
                                            )}
                                    </ul>
                                </div>
                            )}
                        </section>
                        <section className="w-full mt-8">
                            <ul>
                                {selectedTenants &&
                                    selectedTenants.length > 0 &&
                                    selectedTenants.map((tenant) => (
                                        <React.Fragment key={tenant?.id}>
                                            <TenantSearchItem
                                                tenant={tenant}
                                                removeTenant={
                                                    handleRemoveTenant
                                                }
                                            />
                                        </React.Fragment>
                                    ))}
                            </ul>
                            {tenantDropdownItems.length === 0 &&
                                selectedTenants.length === 0 && (
                                    <SearchResult
                                        title="No Tenant search results found "
                                        content=" Please modify search criteria and try searching 
                                      again or you can click on the Tenant invite link to invite Tenant"
                                    />
                                )}
                            <div className="w-full flex justify-center my-[60px]">
                                <Button
                                    title="Add"
                                    className="w-1/2"
                                    onClick={() => {
                                        const isUserVerify = goBackToKyc2(
                                            states,
                                            router
                                        );
                                        if (isUserVerify) {
                                            handleAddTenant();
                                        }
                                    }}
                                    isLoading={isAddTenantLoading}
                                />
                            </div>
                        </section>
                    </div>
                </section>
            </main>
            <DialogModal
                openModal={openModal}
                contentClass="py-5 px-10"
                className="rounded-md  sm:ml-[40%]  lg:ml-[10%]"
                showClose={openModal}
            >
                <div ref={modalRef}>
                    <section>
                        <h3 className="text-xl font-bold text-center py-3">
                            Invite Tenant
                        </h3>
                        <p className="text-[rgba(19,19,19,0.5)]">
                            Invite your tenants to your property. This link will
                            allow them to complete their KYC process quickly and
                            easily
                        </p>
                    </section>
                    <section className="my-8">
                        <label>Email address</label>
                        <div className="flex flex-col lg:flex-row gap-6">
                            <input
                                type="email"
                                placeholder="contact@gmail.com"
                                value={email}
                                onChange={handleEmailChange}
                                className="rounded-md bg-[#FFFFFF] placeholder:text-[#13131373] pl-5 pr-4 py-3 focus:border-primary-600 border border-[#B9B9B9] lg:w-4/5"
                            />
                            <Button
                                title="Send Invite"
                                type="submit"
                                className="lg:w-2/5"
                                onClick={() => handleInviteTenant()}
                                isLoading={loading}
                            />
                        </div>
                    </section>
                    <section className="my-5">
                        <label>Shared read-only link</label>
                        <div
                            className={`transparent-bg py-2 px-5  rounded-md text-base  flex justify-between items-center mt-5 mb-10`}
                        >
                            <input type="text" value={link} />
                            <button
                                className="bg-white py-2 px-4 rounded-md"
                                onClick={handleCopyLink}
                            >
                                Copy link
                            </button>
                        </div>
                    </section>
                </div>
            </DialogModal>
        </div>
    );
}

AddTenant.auth = true;
AddTenant.getLayout = Dashboard.getLayout;
