import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import HomeLayout from 'layouts/home';
import { Property } from 'interfaces';
import { PropertyService } from 'services';
import Loader from 'components/base/Loader';
import Button from 'components/base/Button';
import { ReactElement } from 'react';
import toast from 'react-hot-toast';
import { useAppStore } from 'hooks/useAppStore';

export default function PropertyView() {
    const router = useRouter();
    const { id } = router.query;
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showContactForm, setShowContactForm] = useState(false);
    const [contactData, setContactData] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
    });
    const states = useAppStore();

    useEffect(() => {
        if (id) {
            fetchProperty();
        }
    }, [id]);

    const fetchProperty = async () => {
        try {
            setLoading(true);
            const response = await PropertyService.getPropertyById(
                id as string
            );
            setProperty(response.data.data);
        } catch (error: any) {
            console.error('Error fetching property:', error);

            // Check if it's an authentication error
            if (error?.response?.status === 401) {
                toast.error('Please login to view this property');
                router.push(`/auth/signin?returnUrl=/properties/${id}`);
            } else if (error?.response?.status === 404) {
                toast.error('Property not found');
                router.push('/');
            } else {
                toast.error('Unable to load property. Please try again.');
                router.push('/');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically send the contact form data to your backend
        // For now, we'll just show a success message
        toast.success('Your message has been sent to the property owner!');
        setShowContactForm(false);
        setContactData({ name: '', email: '', phone: '', message: '' });
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setContactData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader loading={loading} />
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        Property Not Found
                    </h1>
                    <Link
                        href="/"
                        className="text-primary-600 hover:text-primary-700"
                    >
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link
                            href="/"
                            className="flex items-center text-gray-600 hover:text-gray-900"
                        >
                            <svg
                                className="w-5 h-5 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            Back to Properties
                        </Link>
                        <h1 className="text-lg font-semibold text-gray-900">
                            Property Details
                        </h1>
                        <div></div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Property Images and Details */}
                    <div className="lg:col-span-2">
                        {/* Image Gallery */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8"
                        >
                            <div className="aspect-[16/10] relative">
                                <Image
                                    src={
                                        property.image_list?.[
                                            selectedImageIndex
                                        ]?.urls?.[0] ||
                                        '/placeholder-property.jpg'
                                    }
                                    alt={property.name || 'Property'}
                                    fill
                                    className="object-cover"
                                />

                                {/* Image Navigation */}
                                {property.image_list &&
                                    property.image_list.length > 1 && (
                                        <>
                                            <button
                                                onClick={() =>
                                                    setSelectedImageIndex(
                                                        (prev) =>
                                                            prev === 0
                                                                ? property
                                                                      .image_list
                                                                      .length -
                                                                  1
                                                                : prev - 1
                                                    )
                                                }
                                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                                            >
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15 19l-7-7 7-7"
                                                    />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setSelectedImageIndex(
                                                        (prev) =>
                                                            prev ===
                                                            property.image_list
                                                                .length -
                                                                1
                                                                ? 0
                                                                : prev + 1
                                                    )
                                                }
                                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                                            >
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 5l7 7-7 7"
                                                    />
                                                </svg>
                                            </button>
                                        </>
                                    )}

                                {/* Status Badge */}
                                <div className="absolute top-4 left-4">
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                            property.is_active
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-500 text-white'
                                        }`}
                                    >
                                        {property.is_active
                                            ? 'Available'
                                            : 'Off Market'}
                                    </span>
                                </div>

                                {/* Price */}
                                <div className="absolute top-4 right-4 bg-primary-600 text-white px-4 py-2 rounded-full">
                                    <span className="text-lg font-bold">
                                        {typeof property.price === 'string'
                                            ? property.price
                                            : `₦${property.price?.toLocaleString()}`}
                                    </span>
                                </div>
                            </div>

                            {/* Thumbnail Strip */}
                            {property.image_list &&
                                property.image_list.length > 1 && (
                                    <div className="p-4 flex gap-2 overflow-x-auto">
                                        {property.image_list.map(
                                            (img: any, index: number) => (
                                                <button
                                                    key={index}
                                                    onClick={() =>
                                                        setSelectedImageIndex(
                                                            index
                                                        )
                                                    }
                                                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                                        selectedImageIndex ===
                                                        index
                                                            ? 'border-primary-500'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <Image
                                                        src={
                                                            img.urls?.[0] ||
                                                            '/placeholder-property.jpg'
                                                        }
                                                        alt={`Property ${
                                                            index + 1
                                                        }`}
                                                        width={80}
                                                        height={80}
                                                        className="object-cover w-full h-full"
                                                    />
                                                </button>
                                            )
                                        )}
                                    </div>
                                )}
                        </motion.div>

                        {/* Property Information */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl shadow-lg p-8"
                        >
                            <div className="mb-6">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    {property.name || 'Property'}
                                </h1>

                                <div className="flex items-center text-gray-600 mb-4">
                                    <svg
                                        className="w-5 h-5 mr-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                    <span>{property.address}</span>
                                    {property.location?.city &&
                                        property.location?.state && (
                                            <span className="ml-2">
                                                • {property.location.city},{' '}
                                                {property.location.state}
                                            </span>
                                        )}
                                </div>

                                {/* Property Features */}
                                <div className="flex flex-wrap gap-4 mb-6">
                                    {(property.propertyType ||
                                        property.apartmentType) && (
                                        <div className="flex items-center bg-primary-50 text-primary-700 px-4 py-2 rounded-full">
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
                                                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
                                                />
                                            </svg>
                                            {property.propertyType ||
                                                property.apartmentType}
                                        </div>
                                    )}

                                    {property.number_of_bedrooms &&
                                        (property.propertyType ||
                                            property.apartmentType) !==
                                            'Land' && (
                                            <div className="flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-full">
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
                                                        d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11"
                                                    />
                                                </svg>
                                                {property.number_of_bedrooms}{' '}
                                                Bedrooms
                                            </div>
                                        )}

                                    {property.number_of_bath &&
                                        (property.propertyType ||
                                            property.apartmentType) !==
                                            'Land' && (
                                            <div className="flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-full">
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
                                                        d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11"
                                                    />
                                                </svg>
                                                {property.number_of_bath}{' '}
                                                Bathrooms
                                            </div>
                                        )}

                                    {property.land_size &&
                                        (property.propertyType ||
                                            property.apartmentType) ===
                                            'Land' && (
                                            <div className="flex items-center bg-yellow-50 text-yellow-700 px-4 py-2 rounded-full">
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
                                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                                    />
                                                </svg>
                                                {property.land_size.value}{' '}
                                                {property.land_size.unit}
                                            </div>
                                        )}

                                    {property.year_built && (
                                        <div className="flex items-center bg-gray-50 text-gray-700 px-4 py-2 rounded-full">
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
                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                            Built {property.year_built}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            {property.description && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                                        Description
                                    </h2>
                                    <p className="text-gray-700 leading-relaxed">
                                        {property.description}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Contact Sidebar */}
                    <div className="lg:col-span-1">
                        {/* Login Banner for Unauthenticated Users */}
                        {!states?.token && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-gradient-to-r from-primary-50 to-blue-50 border-l-4 border-primary-500 rounded-2xl shadow-lg p-6 mb-6"
                            >
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg
                                            className="w-6 h-6 text-primary-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-primary-800">
                                            Login Required
                                        </h3>
                                        <p className="mt-1 text-sm text-primary-700">
                                            Please login to view complete
                                            property details and contact the
                                            owner.
                                        </p>
                                        <div className="mt-4">
                                            <Link
                                                href={`/auth/signin?returnUrl=/properties/${id}`}
                                                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                                            >
                                                Login Now
                                                <svg
                                                    className="w-4 h-4 ml-2"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 5l7 7-7 7"
                                                    />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl shadow-lg p-6 sticky top-4"
                        >
                            <h2 className="text-xl font-bold text-gray-900 mb-6">
                                Contact Property Owner
                            </h2>

                            {!showContactForm ? (
                                <div className="space-y-4">
                                    <button
                                        onClick={() =>
                                            states?.token
                                                ? setShowContactForm(true)
                                                : router.push(
                                                      `/auth/signin?returnUrl=/properties/${id}`
                                                  )
                                        }
                                        className={`w-full font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center ${
                                            states?.token
                                                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                        disabled={!states?.token}
                                    >
                                        <svg
                                            className="w-5 h-5 mr-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                            />
                                        </svg>
                                        {states?.token
                                            ? 'Send Message'
                                            : 'Login to Message'}
                                    </button>

                                    <button
                                        onClick={() =>
                                            states?.token
                                                ? null
                                                : router.push(
                                                      `/auth/signin?returnUrl=/properties/${id}`
                                                  )
                                        }
                                        className={`w-full font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center ${
                                            states?.token
                                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                        disabled={!states?.token}
                                    >
                                        <svg
                                            className="w-5 h-5 mr-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                            />
                                        </svg>
                                        {states?.token
                                            ? 'Call Now'
                                            : 'Login to Call'}
                                    </button>

                                    <button
                                        onClick={() =>
                                            states?.token
                                                ? null
                                                : router.push(
                                                      `/auth/signin?returnUrl=/properties/${id}`
                                                  )
                                        }
                                        className={`w-full font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center ${
                                            states?.token
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                        disabled={!states?.token}
                                    >
                                        <svg
                                            className="w-5 h-5 mr-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                            />
                                        </svg>
                                        {states?.token
                                            ? 'WhatsApp'
                                            : 'Login for WhatsApp'}
                                    </button>
                                </div>
                            ) : states?.token ? (
                                <form
                                    onSubmit={handleContactSubmit}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Your Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={contactData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            placeholder="Enter your full name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={contactData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            placeholder="Enter your email"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={contactData.phone}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            placeholder="Enter your phone number"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Message *
                                        </label>
                                        <textarea
                                            name="message"
                                            value={contactData.message}
                                            onChange={handleInputChange}
                                            required
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            placeholder="I'm interested in this property..."
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowContactForm(false)
                                            }
                                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                                        >
                                            Send Message
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="text-center p-6">
                                    <p className="text-gray-600 mb-4">
                                        Please login to contact the property
                                        owner
                                    </p>
                                    <Link
                                        href={`/auth/signin?returnUrl=/properties/${id}`}
                                        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                                    >
                                        Login to Contact
                                    </Link>
                                </div>
                            )}

                            {/* Property Info Summary */}
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-3">
                                    Quick Info
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Status:
                                        </span>
                                        <span
                                            className={`font-medium ${
                                                property.is_active
                                                    ? 'text-green-600'
                                                    : 'text-gray-600'
                                            }`}
                                        >
                                            {property.is_active
                                                ? 'Available'
                                                : 'Off Market'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Type:
                                        </span>
                                        <span className="font-medium text-gray-900">
                                            {property.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Property ID:
                                        </span>
                                        <span className="font-medium text-gray-900">
                                            #{property.id}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}

PropertyView.getLayout = function getLayout(page: ReactElement) {
    return <HomeLayout>{page}</HomeLayout>;
};
