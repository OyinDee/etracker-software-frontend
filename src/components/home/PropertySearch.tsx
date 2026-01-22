import { IoBedOutline } from 'react-icons/io5';
import { TfiLocationPin } from 'react-icons/tfi';
import { SlHome } from 'react-icons/sl';
import { useEffect, useState } from 'react';
import { getAllGeneralProperties } from 'services/newServices/properties';
import { Property } from 'interfaces';
import nigerianStates from 'libs/nigerian-states.json';

export default function PropertySearch() {
    const [propType, setPropType] = useState('rent');
    const [bedRooms, setBedRooms] = useState<number | string>(1);
    const [city, setCity] = useState('');
    const [type, setType] = useState('');
    const [price, setPrice] = useState('');
    const [properties, setProperties] = useState<Property[]>([]);

    // Get all Nigerian states for the dropdown
    const allNigerianStates = Object.keys(nigerianStates);

    useEffect(() => {
        async function fetchData() {
            const propertyData = await getAllGeneralProperties();
            setProperties(propertyData);
        }
        fetchData();
    }, []);

    const parsePriceRange = (range: any) => {
        const [min, max] = range.split('-').map((value: string) => {
            value = value.trim().toLowerCase();
            if (value.endsWith('k')) {
                return parseInt(value) * 1000;
            } else if (value.endsWith('m')) {
                return parseInt(value) * 1000000;
            } else {
                return parseInt(value);
            }
        });

        return [min, max];
    };

    const handleSearch = () => {
        const searchQuery = {
            city,
            type,
            price,
        };

        if (!searchQuery || Object.keys(searchQuery).length === 0) {
            return properties;
        }

        const [minPrice, maxPrice] = parsePriceRange(price);

        // Convert bedRooms to number for comparison, default to 1 if empty
        const bedroomCount =
            typeof bedRooms === 'string' && bedRooms === ''
                ? 1
                : Number(bedRooms);

        const filteredProperties = properties.filter((property: Property) => {
            const cityMatch =
                !city ||
                (property.location?.city &&
                    property.location.city.toLowerCase() ===
                        city.toLowerCase()) ||
                (property.location?.state &&
                    property.location.state.toLowerCase() ===
                        city.toLowerCase());
            const typeMatch =
                !type ||
                (property.apartmentType &&
                    property.apartmentType.toLowerCase() ===
                        type.toLowerCase());
            const priceMatch =
                !price ||
                (property.price >= minPrice && property.price <= maxPrice);

            return cityMatch && typeMatch && priceMatch;
        });

        // Set a flag to indicate that a search was performed
        localStorage.setItem('searchPerformed', 'true');

        if (filteredProperties.length > 0) {
            localStorage.setItem(
                'filteredProperties',
                JSON.stringify(filteredProperties)
            );

            window.location.reload();
        } else {
            localStorage.setItem('filteredProperties', JSON.stringify([]));

            alert('No properties found matching the search criteria.');

            window.location.reload();
        }

        return filteredProperties;
    };

    return (
        <div className="relative z-10 mx-auto bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 p-8 w-[95%] md:w-[90%] lg:w-[85%] xl:w-[75%] 2xl:w-[65%] -mt-8">
            {/* Property Type Tabs */}
            <div className="flex bg-gray-50 rounded-2xl p-2 mb-8 w-fit mx-auto">
                <button
                    type="button"
                    disabled
                    onClick={() => setPropType('buy')}
                    data-active={propType === 'buy'}
                    className="relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 data-[active='true']:bg-white data-[active='true']:text-primary-600 data-[active='true']:shadow-lg text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Buy
                </button>
                <button
                    type="button"
                    disabled
                    onClick={() => setPropType('sell')}
                    data-active={propType === 'sell'}
                    className="relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 data-[active='true']:bg-white data-[active='true']:text-primary-600 data-[active='true']:shadow-lg text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Sell
                </button>
                <button
                    type="button"
                    onClick={() => setPropType('rent')}
                    data-active={propType === 'rent'}
                    className="relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 data-[active='true']:bg-white data-[active='true']:text-primary-600 data-[active='true']:shadow-lg text-gray-600 hover:text-gray-800"
                >
                    Rent
                </button>
            </div>

            {/* Search Form */}
            <div className="flex flex-col xl:flex-row gap-6 items-end">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 flex-1 w-full">
                    {/* Location Field */}
                    <div className="w-full">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                            <TfiLocationPin className="w-4 h-4 text-primary-500" />
                            Location
                        </label>
                        <select
                            name="state"
                            defaultValue=""
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 appearance-none"
                        >
                            <option value="">Select State</option>
                            {allNigerianStates?.map((state, i) => (
                                <option key={i} value={state}>
                                    {state}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Property Type Field */}
                    <div className="w-full">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                            <SlHome className="w-4 h-4 text-primary-500" />
                            Property Type
                        </label>
                        <select
                            name="type"
                            onChange={(e) => setType(e.target.value)}
                            defaultValue=""
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 appearance-none"
                        >
                            <option value="">Select Type</option>
                            <option value="flat">Flat</option>
                            <option value="mini-flat">Mini Flat</option>
                            <option value="one-bed">One Bedroom</option>
                            <option value="two-bed">Two Bedroom</option>
                            <option value="three-bed">Three Bedroom</option>
                            <option value="four-bed">Four Bedroom</option>
                            <option value="Bungalow">Bungalow</option>
                            <option value="Duplex">Duplex</option>
                        </select>
                    </div>

                    {/* Price Range Field */}
                    <div className="w-full">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                            <span className="w-4 h-4 text-primary-500 font-bold">
                                ₦
                            </span>
                            Price Range
                        </label>
                        <select
                            name="price"
                            onChange={(e) => setPrice(e.target.value)}
                            defaultValue=""
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 appearance-none"
                        >
                            <option value="">Select Range</option>
                            <option value="100k-1M">₦100K - ₦1M</option>
                            <option value="1M-500M">₦1M - ₦500M</option>
                        </select>
                    </div>

                    {/* Bedrooms Field */}
                    <div className="w-full">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                            <IoBedOutline className="w-4 h-4 text-primary-500" />
                            Bedrooms
                        </label>
                        <input
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                    setBedRooms('');
                                } else {
                                    const numValue = parseInt(value);
                                    if (!isNaN(numValue) && numValue >= 1) {
                                        setBedRooms(numValue);
                                    }
                                }
                            }}
                            value={bedRooms}
                            type="number"
                            min="1"
                            max="10"
                            name="bedroom"
                            placeholder="1"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                        />
                    </div>
                </div>

                {/* Search Button */}
                <button
                    onClick={handleSearch}
                    className="group bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg flex items-center gap-2 min-w-[140px] justify-center"
                >
                    <span>Search</span>
                    <svg
                        className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"
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
                </button>
            </div>
        </div>
    );
}
