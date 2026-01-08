import Image from 'next/image';
import Link from 'next/link';
import React, { FC, ReactNode, useEffect } from 'react';
import { FeatureCard } from './FeatureCard';
import { Property } from 'interfaces';

interface PropertyListingProp {
    property: Property;
}
const PropertyListingCard: FC<PropertyListingProp> = ({ property }) => {
    return (
        property && (
            <div key={property?.id} className="h-full">
                <Link href={`/dashboard/properties/${property?.id}`}>
                    <div className="bg-white box-border border border-gray-300 shadow-md rounded-md p-8 w-full h-full flex flex-col">
                        <div className="h-[270px] relative flex-shrink-0">
                            <Image
                                src={property?.image_list[0]?.urls[0]}
                                alt="image"
                                fill
                                className="max-w-full max-h-full object-cover inline-block"
                            />
                        </div>

                        <div className="flex flex-col flex-grow">
                            <p className="flex items-center sm:gap-2 lg:gap-4 pt-5">
                                <svg
                                    width="22"
                                    height="27"
                                    viewBox="0 0 22 27"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M11.2594 13.9998C11.9928 13.9998 12.6208 13.7385 13.1434 13.2158C13.6661 12.6932 13.927 12.0656 13.9261 11.3332C13.9261 10.5998 13.6648 9.97184 13.1421 9.44917C12.6194 8.9265 11.9919 8.66561 11.2594 8.6665C10.5261 8.6665 9.89811 8.92784 9.37544 9.4505C8.85277 9.97317 8.59188 10.6007 8.59277 11.3332C8.59277 12.0665 8.85411 12.6945 9.37677 13.2172C9.89944 13.7398 10.527 14.0007 11.2594 13.9998ZM11.2594 26.8332C11.0817 26.8332 10.9039 26.7998 10.7261 26.7332C10.5483 26.6665 10.3928 26.5776 10.2594 26.4665C7.015 23.5998 4.59277 20.9385 2.99277 18.4825C1.39277 16.0265 0.592773 13.7323 0.592773 11.5998C0.592773 8.2665 1.66522 5.61095 3.81011 3.63317C5.955 1.65539 8.43811 0.666504 11.2594 0.666504C14.0817 0.666504 16.5652 1.65539 18.7101 3.63317C20.855 5.61095 21.927 8.2665 21.9261 11.5998C21.9261 13.7332 21.1261 16.0278 19.5261 18.4838C17.9261 20.9398 15.5039 23.6007 12.2594 26.4665C12.1261 26.5776 11.9706 26.6665 11.7928 26.7332C11.615 26.7998 11.4372 26.8332 11.2594 26.8332Z"
                                        fill="#2F42ED"
                                        fillOpacity="0.8"
                                    />
                                </svg>
                                <span className="font-medium sm:text-sm lg:text-xl">
                                    {property?.address}
                                </span>
                            </p>

                            <p className="text-base sm:text-sm lg:text-xl leading-6 py-3 flex-grow">
                                {property?.description &&
                                property.description.length > 100
                                    ? `${property.description.substring(
                                          0,
                                          100
                                      )}...`
                                    : property?.description}
                            </p>

                            <div className="mt-auto">
                                <ul className="flex items-center md:gap-4 lg:gap-10 mt-2 w-full flex-wrap">
                                    <li>
                                        <FeatureCard
                                            featureIcon={
                                                <svg
                                                    width="21"
                                                    height="17"
                                                    viewBox="0 0 21 17"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M3.59277 17V9H0.592773L10.5928 0L14.5928 3.6V1H17.5928V6.3L20.5928 9H17.5928V17H12.5928V11H8.59277V17H3.59277ZM8.59277 7.025H12.5928C12.5928 6.49167 12.3928 6.054 11.9928 5.712C11.5928 5.37 11.1261 5.19933 10.5928 5.2C10.0594 5.2 9.59277 5.371 9.19277 5.713C8.79277 6.055 8.59277 6.49233 8.59277 7.025Z"
                                                        fill="#2F42ED"
                                                        fillOpacity="0.8"
                                                    />
                                                </svg>
                                            }
                                            featureText={
                                                property?.propertyType ||
                                                property?.apartmentType
                                            }
                                        />
                                    </li>
                                    {/* Only show bathrooms and bedrooms for non-land properties */}
                                    {(property?.propertyType ||
                                        property?.apartmentType) !== 'Land' && (
                                        <>
                                            <li>
                                                <FeatureCard
                                                    featureIcon={
                                                        <svg
                                                            width="17"
                                                            height="14"
                                                            viewBox="0 0 17 14"
                                                            fill="none"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <path
                                                                d="M14.5928 5V2C14.5928 1.46957 14.3821 0.960859 14.007 0.585786C13.6319 0.210714 13.1232 0 12.5928 0H4.59277C4.06234 0 3.55363 0.210714 3.17856 0.585786C2.80349 0.960859 2.59277 1.46957 2.59277 2V5C2.06234 5 1.55363 5.21071 1.17856 5.58579C0.803487 5.96086 0.592773 6.46957 0.592773 7V12H1.92277L2.59277 14H3.59277L4.26277 12H12.9228L13.5928 14H14.5928L15.2628 12H16.5928V7C16.5928 6.46957 16.3821 5.96086 16.007 5.58579C15.6319 5.21071 15.1232 5 14.5928 5ZM7.59277 5H4.59277V2H7.59277M12.5928 5H9.59277V2H12.5928V5Z"
                                                                fill="#2F42ED"
                                                                fillOpacity="0.8"
                                                            />
                                                        </svg>
                                                    }
                                                    featureText={
                                                        property?.number_of_bath +
                                                        ' bathrooms'
                                                    }
                                                />
                                            </li>
                                            <li>
                                                <FeatureCard
                                                    featureIcon={
                                                        <svg
                                                            width="23"
                                                            height="22"
                                                            viewBox="0 0 23 22"
                                                            fill="none"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <path
                                                                d="M3.09277 3.13477C3.09286 2.75484 3.22526 2.3868 3.46722 2.09388C3.70918 1.80096 4.04561 1.60145 4.41869 1.52962C4.79177 1.4578 5.17822 1.51815 5.51164 1.7003C5.84506 1.88245 6.10464 2.17503 6.24577 2.52777L6.38977 2.88577C5.77314 3.33663 5.29508 3.95117 5.00977 4.65977C4.60404 5.65438 4.59688 6.76702 4.98977 7.76677C5.02669 7.86024 5.08201 7.94533 5.15244 8.017C5.22288 8.08866 5.30701 8.14544 5.39982 8.18397C5.49263 8.22249 5.59224 8.24197 5.69272 8.24125C5.79321 8.24053 5.89252 8.21962 5.98477 8.17977L11.9448 5.61377C12.1237 5.53686 12.2657 5.39337 12.3407 5.21365C12.4157 5.03393 12.4179 4.83207 12.3468 4.65077C12.1561 4.15882 11.8694 3.70976 11.5034 3.3298C11.1373 2.94985 10.6993 2.6466 10.2148 2.43777C9.43639 2.10376 8.56947 2.03626 7.74877 2.24577L7.63877 1.97077C7.36829 1.29418 6.87057 0.732939 6.23117 0.383511C5.59176 0.0340841 4.85061 -0.0817033 4.13509 0.0560504C3.41958 0.193804 2.7744 0.576495 2.31043 1.13835C1.84647 1.7002 1.59271 2.40612 1.59277 3.13477V9.99977H1.34277C1.14386 9.99977 0.953096 10.0788 0.812443 10.2194C0.671791 10.3601 0.592773 10.5509 0.592773 10.7498C0.592773 10.9487 0.671791 11.1394 0.812443 11.2801C0.953096 11.4208 1.14386 11.4998 1.34277 11.4998H1.59277V11.8548C1.59277 12.2298 1.59277 12.4498 1.60877 12.6948C1.75077 14.9318 2.95877 16.9968 4.71077 18.3468C4.69659 18.3687 4.68357 18.3914 4.67177 18.4148L3.67177 20.4148C3.58475 20.5925 3.57151 20.7974 3.63494 20.9849C3.69836 21.1724 3.83331 21.3272 4.01037 21.4156C4.18743 21.504 4.39225 21.5188 4.58021 21.4568C4.76816 21.3949 4.924 21.2611 5.01377 21.0848L5.98177 19.1498C6.78743 19.5612 7.66206 19.8205 8.56177 19.9148C8.80677 19.9398 8.95577 19.9448 9.20977 19.9548H9.21677C9.95677 19.9828 10.6808 19.9998 11.3428 19.9998C12.0048 19.9998 12.7288 19.9828 13.4688 19.9548H13.4758C13.7298 19.9448 13.8798 19.9398 14.1238 19.9148C15.0235 19.8205 15.8981 19.5612 16.7038 19.1498L17.6718 21.0858C17.7158 21.1739 17.7768 21.2525 17.8512 21.317C17.9257 21.3816 18.0121 21.4308 18.1055 21.462C18.199 21.4931 18.2977 21.5056 18.396 21.4986C18.4942 21.4916 18.5902 21.4653 18.6783 21.4213C18.7664 21.3772 18.845 21.3162 18.9095 21.2418C18.9741 21.1674 19.0233 21.081 19.0545 20.9875C19.0856 20.894 19.0981 20.7954 19.0911 20.6971C19.0841 20.5988 19.0578 20.5029 19.0138 20.4148L18.0138 18.4148C18.0022 18.3915 17.9895 18.3688 17.9758 18.3468C19.7268 16.9968 20.9358 14.9308 21.0778 12.6948C21.0928 12.4498 21.0928 12.2298 21.0928 11.8548V11.8168C21.0928 11.7568 21.0928 11.6938 21.0888 11.6368C21.0859 11.5909 21.0812 11.5452 21.0748 11.4998H21.3428C21.5417 11.4998 21.7325 11.4208 21.8731 11.2801C22.0138 11.1394 22.0928 10.9487 22.0928 10.7498C22.0928 10.5509 22.0138 10.3601 21.8731 10.2194C21.7325 10.0788 21.5417 9.99977 21.3428 9.99977H3.09277V3.13477Z"
                                                                fill="#2F42ED"
                                                                fillOpacity="0.8"
                                                            />
                                                        </svg>
                                                    }
                                                    featureText={
                                                        property?.number_of_bedrooms +
                                                        ' bedrooms'
                                                    }
                                                />
                                            </li>
                                        </>
                                    )}
                                    {/* Show land size for land properties */}
                                    {(property?.propertyType ||
                                        property?.apartmentType) === 'Land' &&
                                        property?.land_size && (
                                            <li>
                                                <FeatureCard
                                                    featureIcon={
                                                        <svg
                                                            width="21"
                                                            height="17"
                                                            viewBox="0 0 21 17"
                                                            fill="none"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <path
                                                                d="M3.59277 17V9H0.592773L10.5928 0L14.5928 3.6V1H17.5928V6.3L20.5928 9H17.5928V17H12.5928V11H8.59277V17H3.59277ZM8.59277 7.025H12.5928C12.5928 6.49167 12.3928 6.054 11.9928 5.712C11.5928 5.37 11.1261 5.19933 10.5928 5.2C10.0594 5.2 9.59277 5.371 9.19277 5.713C8.79277 6.055 8.59277 6.49233 8.59277 7.025Z"
                                                                fill="#2F42ED"
                                                                fillOpacity="0.8"
                                                            />
                                                        </svg>
                                                    }
                                                    featureText={`${property.land_size.value} ${property.land_size.unit}`}
                                                />
                                            </li>
                                        )}
                                </ul>
                                <p className="flex items-center gap-2 md:gap-3 lg:gap-6 mt-3 text-center">
                                    <span
                                        className={`py-2 px-5 ${
                                            property?.is_active
                                                ? 'bg-[#EBFFE6] text-[#189C02] '
                                                : 'bg-[#EBEBEB] text-[#757575]'
                                        } font-medium md:text-sm lg:text-lg rounded-md`}
                                    >
                                        {property?.is_active
                                            ? 'Active'
                                            : 'Off Market'}
                                    </span>
                                    {/* <span className="py-2 md:px-3 lg:px-5 md:text-sm lg:text-lg font-medium text-[#131313]">
                                        100% occupancy rate
                                    </span> */}
                                </p>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
        )
    );
};

export default PropertyListingCard;
