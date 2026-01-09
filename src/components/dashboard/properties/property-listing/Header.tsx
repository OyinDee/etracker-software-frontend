import Button from 'components/base/Button';
import { useAppStore } from 'hooks/useAppStore';
import { KycStatus } from 'interfaces';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { goBackToKyc2 } from 'utils/helper';
import nigeriaStates from 'nigeria-states-lgas';

const Header = ({ propertyCount }: { propertyCount?: number }) => {
    const states = useAppStore();
    const router = useRouter();
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
    const [selectedFilter, setSelectedFilter] = useState<{
        state?: string;
        propertyActive?: string;
        propertyType?: string;
    }>();
    const [applyFilterKey, setApplyFilterKey] = useState<number>(0);
    const [localStorageChangeKey, setLocalStorageChangeKey] =
        useState<number>(0); // New state variable

    const checkScreenSize = () => {
        setIsMobile(window.innerWidth < 768);
    };

    useEffect(() => {
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    useEffect(() => {
        setSearchTerm(states?.searchParam || '');
    }, [states?.searchParam]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            states?.setSearchParam(searchTerm?.trim());
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const searchTerm = e.target.value;
        setSearchTerm(searchTerm);
        if (searchTerm === '') {
            states?.setSearchParam('');
        }
    };

    const saveFilterDetailsToLocalstorage = () => {
        const filterDetails = {
            state: selectedFilter?.state,
            propertyActive: selectedFilter?.propertyActive,
            propertyType: selectedFilter?.propertyType,
        };

        localStorage.setItem('filterDetails', JSON.stringify(filterDetails));
        setLocalStorageChangeKey((prevKey) => prevKey + 1); // Update localStorageChangeKey to trigger re-render
        // Dispatch custom event to notify filter change
        window.dispatchEvent(new Event('filterChanged'));
    };

    const toggleFilterModal = () => {
        saveFilterDetailsToLocalstorage();
        setShowFilterModal(!showFilterModal);
        setApplyFilterKey((prevKey) => prevKey + 1); // Update applyFilterKey to trigger re-render
    };

    useEffect(() => {
        // This effect will run after every render, effectively causing a remount when applyFilterKey or localStorageChangeKey changes
    }, [applyFilterKey, localStorageChangeKey]);

    const handleFilterSelect = (filter: string, value: string) => {
        setSelectedFilter({ ...selectedFilter, [filter]: value });
    };

    const filterOptions = {
        propertyActives: ['Active', 'Off Market'],
        propertyTypes: {
            Apartments: ['Flat', 'Studio', 'Penthouse', 'Loft'],
            'Landed Properties': [
                'Bungalow',
                'Duplex',
                'Terrace/Townhouse',
                'Mansion',
                'Land',
            ],
            Commercial: ['Office', 'Shop', 'Warehouse', 'Hotel/Lodge'],
        },
    };

    const clearFilterDetails = () => {
        localStorage.removeItem('filterDetails');
        setSelectedFilter({});
        setShowFilterModal(false);
        setApplyFilterKey((prevKey) => prevKey + 1);
    };

    const AddPropertyBtn = (
        <>
            {states?.activeAccount !== 1 && (
                <div className="flex justify-end w-full">
                    <Button
                        className="flex items-center md:py-2 lg:py-3 md:gap-1 lg:gap-2"
                        onClick={() => {
                            const isUserVerify = goBackToKyc2(states, router);
                            if (isUserVerify) {
                                router.push('/dashboard/properties/add');
                            }
                            // if (
                            //     states?.activeKyc?.status ===
                            //     KycStatus.INCOMPLETE
                            // ) {
                            //     states?.setScreen('kyc');
                            //     states?.setActiveKyc(states?.activeKyc);
                            //     states?.setStep(
                            //         states?.activeKyc?.kycStage + 1
                            //     );
                            //     router.push('/onboarding/kyc');
                            // } else {
                            //     router.push('/dashboard/property');
                            // }
                        }}
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M11 19V13H5V11H11V5H13V11H19V13H13V19H11Z"
                                fill="white"
                            />
                        </svg>
                        Add Property
                    </Button>
                </div>
            )}
        </>
    );

    const SearchInput = (
        <>
            <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
                <input
                    type="search"
                    placeholder="Type here to search for property"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                    value={searchTerm}
                    onChange={handleSearch}
                    onKeyDown={handleKeyDown}
                />
            </div>
            <div className="flex justify-end w-full">
                {searchTerm && isMobile ? (
                    <Button
                        title="Clear"
                        className="py-3 px-4 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
                        onClick={() => {
                            states?.setSearchParam('');
                            setSearchTerm('');
                        }}
                    />
                ) : null}
            </div>
        </>
    );
    return (
        <header className="flex flex-col lg:flex-row justify-between items-center w-full my-5 gap-5 lg:gap-20 pb-5 px-5">
            {isMobile ? AddPropertyBtn : null}
            <div className="flex items-center justify-between w-full mb-4">
                <span className="text-xl font-medium whitespace-nowrap">
                    {propertyCount} Total
                </span>
                <div className="flex-1 mx-8">
                    {!isMobile ? SearchInput : null}
                </div>
                <div
                    className="flex items-center cursor-pointer"
                    onClick={() => setShowFilterModal(true)}
                    title="Filter Options"
                >
                    <svg
                        width="24"
                        height="22"
                        viewBox="0 0 24 22"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M9.33334 20.3335C8.95556 20.3335 8.63867 20.2055 8.38267 19.9495C8.12667 19.6935 7.99911 19.3771 8 19.0002C8 18.6224 8.128 18.3055 8.384 18.0495C8.64 17.7935 8.95645 17.6659 9.33334 17.6668H22.6667C23.0444 17.6668 23.3613 17.7948 23.6173 18.0508C23.8733 18.3068 24.0009 18.6233 24 19.0002C24 19.3779 23.872 19.6948 23.616 19.9508C23.36 20.2068 23.0436 20.3344 22.6667 20.3335H9.33334ZM9.33334 12.3335C8.95556 12.3335 8.63867 12.2055 8.38267 11.9495C8.12667 11.6935 7.99911 11.3771 8 11.0002C8 10.6224 8.128 10.3055 8.384 10.0495C8.64 9.7935 8.95645 9.66594 9.33334 9.66683H22.6667C23.0444 9.66683 23.3613 9.79483 23.6173 10.0508C23.8733 10.3068 24.0009 10.6233 24 11.0002C24 11.3779 23.872 11.6948 23.616 11.9508C23.36 12.2068 23.0436 12.3344 22.6667 12.3335H9.33334ZM9.33334 4.3335C8.95556 4.3335 8.63867 4.2055 8.38267 3.9495C8.12667 3.6935 7.99911 3.37705 8 3.00016C8 2.62239 8.128 2.3055 8.384 2.0495C8.64 1.7935 8.95645 1.66594 9.33334 1.66683H22.6667C23.0444 1.66683 23.3613 1.79483 23.6173 2.05083C23.8733 2.30683 24.0009 2.62328 24 3.00016C24 3.37794 23.872 3.69483 23.616 3.95083C23.36 4.20683 23.0436 4.33439 22.6667 4.3335H9.33334ZM2.66667 21.6668C1.93334 21.6668 1.30534 21.4055 0.782669 20.8828C0.260002 20.3602 -0.000886625 19.7326 2.26373e-06 19.0002C2.26373e-06 18.2668 0.261336 17.6388 0.784002 17.1162C1.30667 16.5935 1.93422 16.3326 2.66667 16.3335C3.4 16.3335 4.028 16.5948 4.55067 17.1175C5.07334 17.6402 5.33422 18.2677 5.33334 19.0002C5.33334 19.7335 5.072 20.3615 4.54934 20.8842C4.02667 21.4068 3.39911 21.6677 2.66667 21.6668ZM2.66667 13.6668C1.93334 13.6668 1.30534 13.4055 0.782669 12.8828C0.260002 12.3602 -0.000886625 11.7326 2.26373e-06 11.0002C2.26373e-06 10.2668 0.261336 9.63883 0.784002 9.11616C1.30667 8.5935 1.93422 8.33261 2.66667 8.3335C3.4 8.3335 4.028 8.59483 4.55067 9.1175C5.07334 9.64017 5.33422 10.2677 5.33334 11.0002C5.33334 11.7335 5.072 12.3615 4.54934 12.8842C4.02667 13.4068 3.39911 13.6677 2.66667 13.6668ZM2.66667 5.66683C1.93334 5.66683 1.30534 5.4055 0.782669 4.88283C0.260002 4.36017 -0.000886625 3.73261 2.26373e-06 3.00016C2.26373e-06 2.26683 0.261336 1.63883 0.784002 1.11616C1.30667 0.593498 1.93422 0.332609 2.66667 0.333498C3.4 0.333498 4.028 0.594831 4.55067 1.1175C5.07334 1.64016 5.33422 2.26772 5.33334 3.00016C5.33334 3.7335 5.072 4.3615 4.54934 4.88416C4.02667 5.40683 3.39911 5.66772 2.66667 5.66683Z"
                            fill="black"
                        />
                    </svg>
                    <div className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        {/* <svg
                                width="22"
                                height="20"
                                viewBox="0 0 22 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M21.3197 0.666504H0.653028C0.565785 0.673235 0.484313 0.712709 0.424962 0.777006C0.36561 0.841304 0.332769 0.925668 0.333028 1.01317V2.15984C0.332227 2.27737 0.354801 2.39388 0.399436 2.50261C0.444071 2.61134 0.509878 2.71011 0.593028 2.79317L8.59303 10.7932V17.4598L13.4264 19.8665V10.7798L21.4264 2.77984C21.5794 2.61475 21.6651 2.39829 21.6664 2.17317V1.01317C21.6664 0.921229 21.6298 0.833053 21.5648 0.76804C21.4998 0.703028 21.4116 0.666504 21.3197 0.666504Z"
                                    fill="#131313"
                                    fillOpacity="0.8"
                                />
                            </svg> */}
                    </div>
                </div>
                {!isMobile ? AddPropertyBtn : null}
            </div>
            {isMobile ? SearchInput : null}

            {showFilterModal && (
                <div
                    key={applyFilterKey}
                    className="absolute top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
                >
                    <div className="bg-white rounded-lg p-6">
                        <h2 className="text-lg font-semibold mb-4">
                            Filter Properties
                        </h2>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label
                                    htmlFor="stateFilter"
                                    className="block mb-1"
                                >
                                    State:
                                </label>
                                <select
                                    id="stateFilter"
                                    className="border border-gray-300 rounded px-3 py-2 w-full"
                                    value={selectedFilter?.state}
                                    onChange={(e) =>
                                        handleFilterSelect(
                                            'state',
                                            e.target.value
                                        )
                                    }
                                >
                                    <option disabled value="">
                                        State
                                    </option>
                                    {nigeriaStates
                                        .states()
                                        .map((state: string, i: number) => (
                                            <option key={i} value={state}>
                                                {state}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="propertyTypeFilter"
                                    className="block mb-1"
                                >
                                    Property Status:
                                </label>
                                <select
                                    id="propertyTypeFilter"
                                    className="border border-gray-300 rounded px-3 py-2 w-full"
                                    value={selectedFilter?.propertyActive}
                                    onChange={(e) =>
                                        handleFilterSelect(
                                            'propertyActive',
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">
                                        Select Property Status
                                    </option>
                                    {filterOptions.propertyActives.map(
                                        (type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="propertyTypeFilter"
                                    className="block mb-1"
                                >
                                    Property Type:
                                </label>
                                <select
                                    id="propertyTypeFilter"
                                    className="border border-gray-300 rounded px-3 py-2 w-full"
                                    value={selectedFilter?.propertyType}
                                    onChange={(e) =>
                                        handleFilterSelect(
                                            'propertyType',
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">
                                        Select Property Type
                                    </option>
                                    {Object.entries(
                                        filterOptions.propertyTypes
                                    ).map(([category, types]) => (
                                        <optgroup
                                            key={category}
                                            label={category}
                                        >
                                            {types.map((type) => (
                                                <option key={type} value={type}>
                                                    {type}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-between mt-4">
                            <button
                                className="text-gray-500 hover:text-gray-800"
                                onClick={clearFilterDetails}
                            >
                                Clear
                            </button>
                            <Button onClick={toggleFilterModal}>Apply</Button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
