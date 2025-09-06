import { FC, ReactNode, useEffect, useState } from 'react';
import Dashboard from '..';
import useProperty from 'hooks/useProperty';
import useAccountType from 'hooks/useAccountType';
import PropertyListing from 'components/dashboard/properties/property-listing';
import PropertyListingCard from 'components/dashboard/properties/property-listing/PropertyListingCard';
import DashboardHeader from 'components/dashboard/Header';
import Loader from 'components/base/Loader';
import Box from 'components/Box';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import TenantTable from 'components/dashboard/tenants/TenantTable';
import { useAppStore } from 'hooks/useAppStore';
import { getLandlordTenant } from 'services/newServices/tenant';
import { ReceiptSvg, MoneySvg, VerifySvg } from 'assets/svgIcons/svgIcons';
import { useRouter } from 'next/router';
import Dropdown from 'components/base/Dropdown';
import Image from 'next/image';

interface DetailsRowProps {
    children?: ReactNode;
    title?: string | undefined;
    subheader?: string;
    linkHref?: string;
    linkText?: string;
    Route?: string;
    dropdown?: ReactNode;
    titleColor?: string;
}

const DetailsRowCard: FC<DetailsRowProps> = ({
    title,
    subheader,
    linkHref,
    linkText,
    children,
    Route,
    dropdown,
    titleColor = 'white',
}) => {
    const router = useRouter();
    const handleNavigate = (route: string) => {
        router.push(route);
    };
    return (
        <div className="flex flex-col mb-8 p-8">
            <div className="flex justify-between mb-2">
                <div>
                    <h3
                        style={{ color: titleColor }}
                        className="font-bold text-xl"
                    >
                        {title}
                    </h3>
                    {subheader && <p className="text-sm">{subheader}</p>}{' '}
                </div>
                <a
                    style={{ cursor: 'pointer' }}
                    className="text-blue-500"
                    // @ts-ignore
                    onClick={() => handleNavigate(Route)}
                >
                    {linkText}
                </a>
                {dropdown}
            </div>
            <div className="flex gap-2 my-5 w-full  overflow-x-auto">
                {children}
            </div>
        </div>
    );
};

const LandlordDash: FC = () => {
    const { acctType } = useAccountType();
    const router = useRouter();
    const states = useAppStore();
    const [tenants, setTenants] = useState([]);
    const [occupiedCount, setOccupiedCount] = useState(0);
    const [vacantCount, setVacantCount] = useState(0);

    const {
        getMyProperties,
        getMyPropertiesLoading,
        getMyPropertiesError,
        getProperties,
        getPropertiesLoading,
    } = useProperty();

    const properties = getMyProperties?.data?.data || [];
    const propertiesLoading = getMyPropertiesLoading;

    // Debug logging
    console.log('LandlordDash Debug:', {
        acctType,
        getMyProperties,
        getMyPropertiesLoading,
        getMyPropertiesError,
        properties: properties.length,
        activeAccount: states?.activeAccount,
        user: states?.user?.id,
    });

    useEffect(() => {
        if (!getMyProperties?.data?.data) return;
        const allProperties = getMyProperties.data.data;

        let occupied = 0;
        let vacant = 0;

        if (allProperties) {
            allProperties.forEach((property) => {
                // @ts-ignore
                if (property.tenant && property.tenant.length > 0) {
                    occupied++;
                } else {
                    vacant++;
                }
            });
        }

        setOccupiedCount(occupied);
        setVacantCount(vacant);
    }, [getMyProperties?.data.data]);

    const totalProperties = occupiedCount + vacantCount;
    const occupiedPercentage = (occupiedCount / totalProperties) * 100;

    const propertie = getMyProperties?.data.data.map((property) => ({
        value: property.id,
        label: property.name,
    }));

    const getPropertyName = (id: string) => {
        const property = propertie?.find((p) => p.value === id);
        return property?.label;
    };
    useEffect(() => {
        async function fetchData() {
            const tenantData = await getLandlordTenant(states?.user?.id);
            setTenants(tenantData);
        }
        if (states?.user?.id) {
            fetchData();
        }
    }, [states, getMyProperties?.data.data]);

    const handleNavigate = (route: string) => {
        router.push(route);
    };
    return (
        <div className="max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <DashboardHeader title="Dashboard Overview" />
            </header>
            {getMyPropertiesError ? (
                <div className="text-red-500 text-center py-8">
                    Failed to load properties. Please try again later.
                    <br />
                    {(() => {
                        if (
                            typeof getMyPropertiesError === 'object' &&
                            getMyPropertiesError !== null &&
                            'message' in getMyPropertiesError
                        ) {
                            return String(getMyPropertiesError.message);
                        }
                        return String(getMyPropertiesError);
                    })()}
                </div>
            ) : propertiesLoading ? (
                <Loader loading={propertiesLoading} />
            ) : (
                <section>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Property Management Section */}
                        <div className="rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-xl">
                                <h2 className="text-white text-xl font-semibold mb-6">
                                    Property Management
                                </h2>
                                <div className="flex gap-4 overflow-x-auto pb-4">
                                    <Box
                                        onClick={() =>
                                            handleNavigate('dashboard/tenants')
                                        }
                                        route="dashboard/tenants"
                                        title="Issue Receipt"
                                        icon={<ReceiptSvg />}
                                        className="bg-white/10 hover:bg-white/20 transition-colors"
                                    />
                                    <Box
                                        onClick={() =>
                                            handleNavigate(
                                                'dashboard/tenants/verify'
                                            )
                                        }
                                        route="dashboard/tenants/verify"
                                        title="Verify Tenant"
                                        icon={<VerifySvg />}
                                        className="bg-white/10 hover:bg-white/20 transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="bg-white p-6">
                                <Image
                                    src="/house.png"
                                    width={579}
                                    height={350}
                                    alt="e-tracka"
                                    className="w-full h-auto rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Properties Overview Section */}
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold">
                                    Properties Overview
                                </h2>
                                <button
                                    onClick={() =>
                                        handleNavigate('/dashboard/properties')
                                    }
                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    View Properties
                                </button>
                            </div>
                            <div className="flex items-center justify-center gap-8">
                                <div className="w-40">
                                    <CircularProgressbar
                                        value={occupiedPercentage}
                                        text={`${totalProperties}`}
                                        styles={buildStyles({
                                            rotation: 0.25,
                                            textSize: '20px',
                                            pathColor: `rgba(222, 80, 0, 1)`,
                                            textColor: '#1a1a1a',
                                            trailColor: '#8D03CE',
                                        })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 bg-[#8D03CE] rounded"></div>
                                        <p className="text-sm font-medium">
                                            {vacantCount} Vacant Properties
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 bg-[rgba(222,80,0,1)] rounded"></div>
                                        <p className="text-sm font-medium">
                                            {occupiedCount} Occupied Properties
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tenants Section */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 border-l-4 border-blue-600">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold">
                                        Tenants
                                    </h2>
                                    <p className="text-gray-600 text-sm mt-1">
                                        List of your tenants
                                    </p>
                                </div>
                                <Dropdown
                                    title={
                                        getPropertyName(
                                            states?.propertyId as string
                                        ) || 'All Properties'
                                    }
                                    className="border border-gray-200 rounded-lg"
                                    ulClassName="bg-white shadow-lg rounded-lg mt-2"
                                    btnClasssName="py-2 px-4 text-sm font-medium"
                                >
                                    <li
                                        key="all"
                                        className={`py-4 px-3 text-black border-b border-[#E7E5E5] last:border:0 cursor-pointer hover:bg-slate-50 ${
                                            states?.propertyId === '' &&
                                            'bg-slate-50'
                                        }`}
                                    >
                                        <button
                                            onClick={(e) => {
                                                states?.setPropertyId('');
                                            }}
                                        >
                                            All Properties
                                        </button>
                                    </li>
                                    {propertie?.map((property) => (
                                        <li
                                            key={property.value}
                                            className={`py-4 px-3 text-black border-b border-[#E7E5E5] last:border:0 cursor-pointer hover:bg-slate-50 ${
                                                states?.propertyId ===
                                                    property.value &&
                                                'bg-slate-50'
                                            }`}
                                        >
                                            <button
                                                data-id={property.value}
                                                onClick={(e) => {
                                                    states?.setPropertyId(
                                                        e.currentTarget.dataset
                                                            .id as string
                                                    );
                                                }}
                                                className="whitespace-nowrap"
                                            >
                                                {property.label}
                                            </button>
                                        </li>
                                    ))}
                                </Dropdown>
                            </div>
                            <TenantTable tenants={tenants} />
                        </div>
                    </div>

                    {/* My Units Section */}
                    <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 border-l-4 border-blue-600">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold">
                                    My Units
                                </h2>
                            </div>
                            <div className="flex gap-6 overflow-x-auto pb-4">
                                {Array.isArray(properties) &&
                                properties.length ? (
                                    properties.map((property) => (
                                        <div
                                            key={property?.id}
                                            className="flex-none"
                                        >
                                            <PropertyListingCard
                                                property={property}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-8 w-full">
                                        No property record found
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};
// @ts-ignore
LandlordDash.auth = true;
// @ts-ignore
LandlordDash.getLayout = Dashboard.getLayout;

export default LandlordDash;
