import HomeLayout from 'layouts/home';
import { ReactElement, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PropertySearch from 'components/home/PropertySearch';
import PropertyListingCard from 'components/dashboard/properties/property-listing/PropertyListingCard';
import { getAllGeneralProperties } from 'services/newServices/properties';
import { motion } from 'framer-motion';

const SERVICES = [
    {
        title: 'Property Data',
        img: '/Home/Properties.svg',
        content:
            'Access comprehensive data on properties for buying, renting, and gathering information. Tenants can also chat directly with landlords and property managers.',
    },
    {
        title: 'Landlord Insights',
        img: '/Home/Landlords.svg',
        content:
            'Get valuable insights into landlords’ characteristics to help you make informed decisions and enhance your property search experience.',
    },
    {
        title: 'Tenant Information',
        img: '/Home/Tenants.svg',
        content:
            'Store and access tenancy data to streamline processes and make better decisions regarding tenant management.',
    },
];

export default function Home() {
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSearchActive, setIsSearchActive] = useState(false);

    // Function to get 3 random properties from an array
    const getRandomProperties = (propertyArray: any[], count: number = 3) => {
        if (!Array.isArray(propertyArray) || propertyArray.length === 0) {
            return [];
        }

        const shuffled = [...propertyArray].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    };

    useEffect(() => {
        const storedProperty = localStorage.getItem('filteredProperties');
        const searchPerformed = localStorage.getItem('searchPerformed');

        const property = storedProperty ? JSON.parse(storedProperty) : null;

        if (property && searchPerformed === 'true') {
            setProperties(property);
            setIsSearchActive(true); // A search was actually performed
            setLoading(false);
            // Clear the search flag after using it
            localStorage.removeItem('searchPerformed');
            return;
        }

        // Clear any stale filtered properties
        if (storedProperty) {
            localStorage.removeItem('filteredProperties');
        }

        async function fetchData() {
            try {
                const propertyData = await getAllGeneralProperties();
                // Show only 3 random properties when not searching
                const randomProperties = getRandomProperties(propertyData, 3);
                setProperties(randomProperties);
            } catch (error) {
                console.error('Failed to fetch properties', error);
                // Optionally set properties to an empty array on error
                setProperties([]);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <>
            <motion.section
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-primary-50"
            >
                {/* Animated background elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary-100/20 to-blue-100/20 rounded-full blur-3xl"></div>
                </div>

                <div className="relative pt-20 pb-16 md:pb-20 lg:pb-24 px-6 lg:px-16">
                    <div className="max-w-7xl mx-auto w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[60vh] md:min-h-[70vh] lg:min-h-[75vh]">
                            {/* Left Content */}
                            <div className="text-left space-y-8">
                                <div className="inline-flex items-center bg-primary-100 text-primary-700 px-6 py-3 rounded-full text-sm font-semibold">
                                    <span className="w-2 h-2 bg-primary-500 rounded-full mr-3 animate-pulse"></span>
                                    Trusted by 200+ Real Estate Professionals
                                </div>

                                <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                                    Find Your
                                    <span className="block text-primary-600 bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
                                        Dream Home
                                    </span>
                                    <span className="text-4xl lg:text-5xl text-gray-700 font-medium">
                                        with confidence
                                    </span>
                                </h1>

                                <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                                    E-Tracka connects you with verified
                                    properties, trusted agents, and
                                    comprehensive market data to make your real
                                    estate journey seamless.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link href="/auth/signup">
                                        <span className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                                            Start Your Search
                                            <svg
                                                className="ml-2 w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                                                />
                                            </svg>
                                        </span>
                                    </Link>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-primary-600 mb-1">
                                            1200+
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Properties Listed
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-primary-600 mb-1">
                                            200+
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Verified Agents
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-primary-600 mb-1">
                                            100+
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Areas Covered
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Visual - Feature
                            <div className="relative">
                                <div className="relative z-10">
                                    <div className="bg-white rounded-3xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                                        <div className="aspect-[4/3] relative rounded-2xl overflow-hidden mb-6">
                                            <Imagey */}
                            <div className="relative">
                                {!loading && properties.length > 0 ? (
                                    <div className="relative z-10">
                                        <div className="bg-white rounded-3xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                                            <div className="aspect-[4/3] relative rounded-2xl overflow-hidden mb-6">
                                                <Image
                                                    src={
                                                        properties[0]
                                                            ?.image_list?.[0]
                                                            ?.urls?.[0] ||
                                                        '/hero-banner.png'
                                                    }
                                                    alt={
                                                        properties[0]?.name ||
                                                        'Featured Property'
                                                    }
                                                    fill
                                                    className="object-cover"
                                                />
                                                <div className="absolute top-4 left-4 bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                    Featured
                                                </div>
                                                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                    {properties[0]?.status ||
                                                        'Available'}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                                                    {properties[0]?.title ||
                                                        properties[0]?.name ||
                                                        'Premium Property'}
                                                </h3>
                                                <p className="text-gray-600">
                                                    {/* Show property type */}
                                                    {(properties[0]
                                                        ?.propertyType ||
                                                        properties[0]
                                                            ?.apartmentType) &&
                                                        `${
                                                            properties[0]
                                                                ?.propertyType ||
                                                            properties[0]
                                                                ?.apartmentType
                                                        }`}
                                                    {/* Show beds and baths only for non-land properties */}
                                                    {(properties[0]
                                                        ?.propertyType ||
                                                        properties[0]
                                                            ?.apartmentType) !==
                                                        'Land' && (
                                                        <>
                                                            {properties[0]
                                                                ?.number_of_bedrooms &&
                                                                ` • ${properties[0].number_of_bedrooms} beds`}
                                                            {properties[0]
                                                                ?.number_of_bath &&
                                                                ` • ${properties[0].number_of_bath} baths`}
                                                        </>
                                                    )}
                                                    {/* Show land size for land properties */}
                                                    {(properties[0]
                                                        ?.propertyType ||
                                                        properties[0]
                                                            ?.apartmentType) ===
                                                        'Land' &&
                                                        properties[0]
                                                            ?.land_size &&
                                                        ` • ${properties[0].land_size.value} ${properties[0].land_size.unit}`}
                                                    {/* Show location */}
                                                    {properties[0]?.location
                                                        ?.city &&
                                                        properties[0]?.location
                                                            ?.state &&
                                                        ` • ${properties[0].location.city}, ${properties[0].location.state}`}
                                                    {/* Fallback to address if no other info */}
                                                    {!(
                                                        properties[0]
                                                            ?.propertyType ||
                                                        properties[0]
                                                            ?.apartmentType
                                                    ) &&
                                                        !properties[0]
                                                            ?.number_of_bedrooms &&
                                                        !properties[0]
                                                            ?.number_of_bath &&
                                                        !properties[0]?.location
                                                            ?.city &&
                                                        `${
                                                            properties[0]
                                                                ?.address ||
                                                            'Prime Location'
                                                        }`}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-2xl font-bold text-primary-600">
                                                        {properties[0]?.price
                                                            ? typeof properties[0]
                                                                  .price ===
                                                              'string'
                                                                ? properties[0]
                                                                      .price
                                                                : `₦${properties[0].price.toLocaleString()}`
                                                            : 'Contact for Price'}
                                                    </span>
                                                    <div className="flex items-center text-yellow-500">
                                                        <svg
                                                            className="w-4 h-4 fill-current"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                                        </svg>
                                                        <span className="ml-1 text-sm text-gray-600">
                                                            {properties[0]
                                                                ?.rating ||
                                                                '4.8'}{' '}
                                                            (
                                                            {properties[0]
                                                                ?.reviews ||
                                                                '89'}
                                                            )
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative z-10">
                                        <div className="bg-white rounded-3xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                                            <div className="aspect-[4/3] relative rounded-2xl overflow-hidden mb-6 bg-gray-200 animate-pulse">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="text-gray-400 text-lg">
                                                        Loading...
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                                                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                                <div className="flex items-center justify-between">
                                                    <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Floating elements */}
                                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg p-4 z-20 animate-bounce">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="text-sm font-semibold text-gray-700">
                                            Just Listed
                                        </span>
                                    </div>
                                </div>

                                <div className="absolute -bottom-4 -left-4 bg-primary-600 text-white rounded-2xl shadow-lg p-4 z-20">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold">
                                            98%
                                        </div>
                                        <div className="text-xs opacity-90">
                                            Success Rate
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Search Section */}
            <motion.section
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
                className="relative bg-white py-8 md:py-12 lg:py-16 -mt-8 md:-mt-12 lg:-mt-16 z-10"
            >
                <div className="max-w-7xl mx-auto px-6">
                    <PropertySearch />
                </div>
            </motion.section>

            {/* Properties Section */}
            <motion.section
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
                className="py-16 md:py-20 lg:py-24 bg-gradient-to-br from-white via-gray-50 to-white relative overflow-hidden"
            >
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent"></div>
                <div className="absolute top-20 right-20 w-64 h-64 bg-primary-100/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-20 w-80 h-80 bg-blue-100/20 rounded-full blur-3xl"></div>

                <div className="max-w-7xl mx-auto px-6 relative">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center bg-primary-50 text-primary-700 px-6 py-2 rounded-full text-sm font-semibold mb-6">
                            <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                            </svg>
                            Featured Properties
                        </div>

                        <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            Explore{' '}
                            <span className="text-primary-600 relative">
                                Your Dream
                                <div className="absolute -bottom-2 left-0 right-0 h-3 bg-primary-200/50 -skew-x-12"></div>
                            </span>{' '}
                            Properties
                        </h2>

                        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                            Discover handpicked properties that match your
                            lifestyle and budget. Each listing is verified and
                            comes with comprehensive details to help you make
                            informed decisions.
                        </p>

                        <div className="w-32 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-blue-500 mx-auto rounded-full"></div>
                    </div>

                    {/* Property Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                            <div className="text-3xl font-bold text-primary-600 mb-2">
                                {/* {Array.isArray(properties) ? properties.length : 0} */}
                                100+
                            </div>
                            <div className="text-sm text-gray-600 font-medium">
                                Available Now
                            </div>
                        </div>
                        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                            <div className="text-3xl font-bold text-green-600 mb-2">
                                100%
                            </div>
                            <div className="text-sm text-gray-600 font-medium">
                                Verified
                            </div>
                        </div>
                        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                                24/7
                            </div>
                            <div className="text-sm text-gray-600 font-medium">
                                Support
                            </div>
                        </div>
                        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                            <div className="text-3xl font-bold text-purple-600 mb-2">
                                Fast
                            </div>
                            <div className="text-sm text-gray-600 font-medium">
                                Response
                            </div>
                        </div>
                    </div>

                    {/* Properties Grid - staggered cards */}
                    <motion.div
                        className="relative"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        variants={{
                            visible: { transition: { staggerChildren: 0.15 } },
                            hidden: {},
                        }}
                    >
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[1, 2, 3].map((i) => (
                                    <motion.div
                                        key={i}
                                        variants={{
                                            hidden: { opacity: 0, y: 40 },
                                            visible: {
                                                opacity: 1,
                                                y: 0,
                                                transition: {
                                                    duration: 0.6,
                                                    ease: 'easeOut',
                                                },
                                            },
                                        }}
                                        className="bg-white rounded-3xl shadow-lg overflow-hidden animate-pulse"
                                    >
                                        <div className="h-64 bg-gray-200"></div>
                                        <div className="p-6 space-y-4">
                                            <div className="h-6 bg-gray-200 rounded"></div>
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : Array.isArray(properties) &&
                          properties.length > 0 ? (
                            <>
                                <motion.div
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, amount: 0.2 }}
                                    variants={{
                                        visible: {
                                            transition: {
                                                staggerChildren: 0.15,
                                            },
                                        },
                                        hidden: {},
                                    }}
                                >
                                    {properties.map((property, index) => (
                                        // @ts-ignore
                                        <motion.div
                                            key={property?.id}
                                            variants={{
                                                hidden: { opacity: 0, y: 40 },
                                                visible: {
                                                    opacity: 1,
                                                    y: 0,
                                                    transition: {
                                                        duration: 0.6,
                                                        ease: 'easeOut',
                                                    },
                                                },
                                            }}
                                            className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-gray-100"
                                            style={{
                                                animationDelay: `${
                                                    index * 100
                                                }ms`,
                                            }}
                                        >
                                            {/* Property Badge */}
                                            <div className="absolute top-4 left-4 z-10">
                                                <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                                    {index === 0
                                                        ? 'Featured'
                                                        : 'Premium'}
                                                </span>
                                            </div>

                                            {/* Heart Icon */}
                                            <div className="absolute top-4 right-4 z-10">
                                                <button className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors group-hover:scale-110 transform duration-300">
                                                    <svg
                                                        className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>

                                            <PropertyListingCard
                                                property={property}
                                            />
                                        </motion.div>
                                    ))}
                                </motion.div>

                                {/* View More Button */}
                                <div className="text-center">
                                    <Link href="/dashboard/properties">
                                        <span className="inline-flex items-center bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                                            View All Properties
                                            <svg
                                                className="ml-2 w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                                                />
                                            </svg>
                                        </span>
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-20">
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-16 max-w-lg mx-auto border border-gray-200">
                                    <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                                        <svg
                                            className="w-10 h-10 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                        {isSearchActive
                                            ? 'No Properties Found'
                                            : 'No Properties Available'}
                                    </h3>
                                    <p className="text-gray-600 text-lg leading-relaxed">
                                        {isSearchActive
                                            ? 'Try adjusting your search criteria or browse all available properties.'
                                            : 'New properties are added regularly. Check back soon or sign up for notifications.'}
                                    </p>
                                    <Link href="/auth/signup">
                                        <span className="inline-block mt-6 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
                                            Get Notified
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </motion.section>

            {/* Services Section */}
            <motion.section
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
                className="py-24 bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-50/20 to-transparent"></div>

                <div className="max-w-7xl mx-auto px-6 relative">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            Why Choose{' '}
                            <span className="text-primary-600">E-Tracka</span>
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Discover the comprehensive solutions that make us
                            your trusted real estate partner
                        </p>
                        <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-primary-700 mx-auto mt-6"></div>
                    </div>

                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        variants={{
                            visible: { transition: { staggerChildren: 0.15 } },
                            hidden: {},
                        }}
                    >
                        {SERVICES.map((service, i) => (
                            <motion.div
                                key={i}
                                variants={{
                                    hidden: { opacity: 0, y: 40 },
                                    visible: {
                                        opacity: 1,
                                        y: 0,
                                        transition: {
                                            duration: 0.6,
                                            ease: 'easeOut',
                                        },
                                    },
                                }}
                                className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl text-center transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                            >
                                <div className="w-20 h-20 mx-auto mb-6 relative group-hover:scale-110 transition-transform duration-300">
                                    <Image
                                        src={service.img}
                                        alt={service.title}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <h3 className="font-bold text-2xl mb-4 text-gray-900 group-hover:text-primary-600 transition-colors">
                                    {service.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed text-lg">
                                    {service.content}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </motion.section>

            {/* About Us Section */}
            <motion.section
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.4 }}
                id="aboutus"
                className="py-24 bg-white relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary-100/30 to-transparent rounded-full -translate-y-48 translate-x-48"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-primary-100/30 to-transparent rounded-full translate-y-48 -translate-x-48"></div>

                <div className="max-w-7xl mx-auto px-6 relative">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
                            Our Mission &{' '}
                            <span className="text-primary-600">Vision</span>
                        </h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-primary-700 mx-auto mb-8"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 p-8 rounded-2xl border-l-4 border-primary-500">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                    Our Commitment
                                </h3>
                                <p className="text-lg text-gray-700 leading-relaxed">
                                    At E-Tracka, we are committed to{' '}
                                    <span className="text-primary-600 font-semibold">
                                        honesty, integrity, and transparency
                                    </span>{' '}
                                    in everything we do.
                                </p>
                            </div>

                            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 p-8 rounded-2xl border-l-4 border-gray-400">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                    Our Mission
                                </h3>
                                <p className="text-lg text-gray-700 leading-relaxed">
                                    Our mission is to ensure that you find your
                                    dream home with confidence and ease through
                                    innovative technology solutions.
                                </p>
                            </div>

                            <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 p-8 rounded-2xl border-l-4 border-primary-500">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                    Our Vision
                                </h3>
                                <p className="text-lg text-gray-700 leading-relaxed">
                                    Our vision is to be the leading real estate
                                    platform providing reliable data and
                                    seamless property management services.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="relative group">
                                <div className="relative w-full h-64 rounded-2xl overflow-hidden shadow-xl transform group-hover:scale-105 transition-transform duration-300">
                                    <Image
                                        src="/house-1.png"
                                        alt="Modern House"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                </div>
                            </div>
                            <div className="relative group mt-8 sm:mt-0">
                                <div className="relative w-full h-64 rounded-2xl overflow-hidden shadow-xl transform group-hover:scale-105 transition-transform duration-300">
                                    <Image
                                        src="/house-2.png"
                                        alt="Luxury Property"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* FAQ Section */}
            <motion.section
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.5 }}
                id="faq"
                className="py-24 bg-gradient-to-br from-gray-100 to-gray-50 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent"></div>

                <div className="max-w-4xl mx-auto px-6 relative">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            Frequently Asked{' '}
                            <span className="text-primary-600">Questions</span>
                        </h2>
                        <p className="text-xl text-gray-600">
                            Get answers to common questions about E-Tracka
                        </p>
                        <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-primary-700 mx-auto mt-6"></div>
                    </div>

                    <motion.div
                        className="space-y-6"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        variants={{
                            visible: { transition: { staggerChildren: 0.12 } },
                            hidden: {},
                        }}
                    >
                        {/* FAQ cards */}
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 40 },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    transition: {
                                        duration: 0.6,
                                        ease: 'easeOut',
                                    },
                                },
                            }}
                            className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
                        >
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-start">
                                <span className="text-primary-600 mr-3 text-2xl">
                                    Q:
                                </span>
                                What services does E-Tracka offer?
                            </h3>
                            <p className="text-gray-700 text-lg leading-relaxed ml-8">
                                <span className="text-primary-600 font-semibold">
                                    A:
                                </span>{' '}
                                E-Tracka offers comprehensive property listings,
                                detailed landlord and tenant data, and advanced
                                property management solutions to streamline your
                                real estate experience.
                            </p>
                        </motion.div>

                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 40 },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    transition: {
                                        duration: 0.6,
                                        ease: 'easeOut',
                                    },
                                },
                            }}
                            className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
                        >
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-start">
                                <span className="text-primary-600 mr-3 text-2xl">
                                    Q:
                                </span>
                                How can I trust the data provided by E-Tracka?
                            </h3>
                            <p className="text-gray-700 text-lg leading-relaxed ml-8">
                                <span className="text-primary-600 font-semibold">
                                    A:
                                </span>{' '}
                                E-Tracka ensures all data is thoroughly verified
                                and regularly updated, providing you with
                                reliable and accurate information for making
                                confident real estate decisions.
                            </p>
                        </motion.div>

                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 40 },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    transition: {
                                        duration: 0.6,
                                        ease: 'easeOut',
                                    },
                                },
                            }}
                            className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
                        >
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-start">
                                <span className="text-primary-600 mr-3 text-2xl">
                                    Q:
                                </span>
                                How do I get started with E-Tracka?
                            </h3>
                            <p className="text-gray-700 text-lg leading-relaxed ml-8">
                                <span className="text-primary-600 font-semibold">
                                    A:
                                </span>{' '}
                                Simply sign up on our website and explore our
                                comprehensive services tailored to meet your
                                specific real estate needs and goals.
                            </p>
                        </motion.div>

                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 40 },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    transition: {
                                        duration: 0.6,
                                        ease: 'easeOut',
                                    },
                                },
                            }}
                            className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
                        >
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-start">
                                <span className="text-primary-600 mr-3 text-2xl">
                                    Q:
                                </span>
                                Can I contact property owners directly through
                                E-Tracka?
                            </h3>
                            <p className="text-gray-700 text-lg leading-relaxed ml-8">
                                <span className="text-primary-600 font-semibold">
                                    A:
                                </span>{' '}
                                Yes! E-Tracka provides direct communication
                                channels that allow tenants to chat seamlessly
                                with landlords and property managers.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.section>

            {/* Contact Section */}
            <motion.section
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.6 }}
                id="contactus"
                className="py-32 bg-gradient-to-br from-gray-50 via-white to-primary-50 relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-100/30 to-transparent"></div>
                <div className="absolute top-20 right-20 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-20 w-80 h-80 bg-blue-200/15 rounded-full blur-3xl"></div>

                <div className="max-w-6xl mx-auto px-6 relative text-center">
                    <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-16">
                        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-8">
                            Are you an{' '}
                            <span className="text-primary-600">
                                estate agent
                            </span>{' '}
                            or{' '}
                            <span className="text-primary-600">
                                property owner
                            </span>
                            ?
                        </h2>

                        <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-primary-700 mx-auto mb-8"></div>

                        <p className="text-2xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
                            Join thousands of professionals who trust E-Tracka
                            to showcase their properties.
                        </p>

                        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl p-8 mb-12 border border-primary-200">
                            <p className="text-3xl font-bold text-gray-900 mb-2">
                                List your property for{' '}
                                <span className="text-primary-600">FREE</span>
                            </p>
                            <p className="text-gray-600 text-lg">
                                No hidden fees, no commitments - just results
                            </p>
                        </div>

                        <Link href="/auth/signup">
                            <span className="inline-block bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white rounded-full px-6 sm:px-12 lg:px-16 py-3 sm:py-4 lg:py-5 text-lg sm:text-xl lg:text-2xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-xl">
                                <span className="sm:hidden">Get Started →</span>
                                <span className="hidden sm:inline">
                                    Get Started Today →
                                </span>
                            </span>
                        </Link>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-center">
                            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
                                <div className="text-4xl font-bold text-primary-600 mb-2">
                                    24/7
                                </div>
                                <div className="text-lg text-gray-600">
                                    Support Available
                                </div>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
                                <div className="text-4xl font-bold text-primary-600 mb-2">
                                    0%
                                </div>
                                <div className="text-lg text-gray-600">
                                    Commission Fees
                                </div>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
                                <div className="text-4xl font-bold text-primary-600 mb-2">
                                    ∞
                                </div>
                                <div className="text-lg text-gray-600">
                                    Listing Potential
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>
        </>
    );
}

Home.getLayout = function getLayout(page: ReactElement) {
    return <HomeLayout>{page}</HomeLayout>;
};
