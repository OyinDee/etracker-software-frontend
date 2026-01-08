import { Property } from 'interfaces';
import React, { FC, useMemo, useState, useEffect } from 'react';
import Header from './Header';
import PropertyListingCard from './PropertyListingCard';
import { useAppStore } from 'hooks/useAppStore';

interface PropertyProp {
    properties: Property[] | undefined;
}

const Property: FC<PropertyProp> = ({ properties }) => {
    const searchParam = useAppStore<string>((state) => state.searchParam || '');
    interface FilterDetails {
        state?: string;
        propertyActive?: 'Active' | 'Off Market' | '';
        apartmentType?: string;
    }

    const [filterDetails, setFilterDetails] = useState<FilterDetails | null>(
        null
    );

    // Move localStorage access to useEffect
    useEffect(() => {
        const readFilterDetails = () => {
            const filterDetailsString = localStorage.getItem('filterDetails');
            if (filterDetailsString) {
                try {
                    const parsed = JSON.parse(filterDetailsString);
                    setFilterDetails(parsed);
                } catch (e) {
                    console.error('Error parsing filter details:', e);
                }
            } else {
                setFilterDetails(null);
            }
        };
        readFilterDetails();
        // Listen for filterChanged event
        window.addEventListener('filterChanged', readFilterDetails);
        return () => {
            window.removeEventListener('filterChanged', readFilterDetails);
        };
    }, []);

    const filteredProperties = useMemo(() => {
        if (!properties) return [];

        // First apply search filter
        let filtered = searchParam
            ? properties.filter((property: Property) =>
                  property.name
                      .toLowerCase()
                      .includes(searchParam.toLowerCase())
              )
            : properties;

        // Then apply other filters
        if (filterDetails) {
            // @ts-ignore
            const { state, propertyActive, propertyType } = filterDetails;

            filtered = filtered.filter((property: Property) => {
                if (
                    state &&
                    !property.location.state
                        .toLowerCase()
                        .includes((state as string).toLowerCase())
                ) {
                    return false;
                }

                const isActive =
                    propertyActive === 'Active'
                        ? true
                        : propertyActive === 'Off Market'
                        ? false
                        : undefined;

                if (isActive !== undefined && property.is_active !== isActive) {
                    return false;
                }

                if (
                    propertyType &&
                    (property.propertyType || property.apartmentType) &&
                    !(property.propertyType || property.apartmentType)
                        .toLowerCase()
                        .includes(propertyType.toLowerCase())
                ) {
                    return false;
                }

                return true;
            });
        }

        return filtered;
    }, [properties, searchParam, filterDetails]);

    // Add a loading state for initial render
    if (typeof window === 'undefined') {
        return <div className="w-full" />;
    }

    return (
        <div className="w-full">
            <Header propertyCount={filteredProperties.length} />
            <section className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10 w-full mb-10 min-h-[300px] ">
                {filteredProperties.length > 0 ? (
                    filteredProperties.map((property) => (
                        <div key={property?.id} className="w-full">
                            <PropertyListingCard property={property} />
                        </div>
                    ))
                ) : (
                    <p className="flex justify-center items-center text-center text-xl w-full">
                        No property record found
                    </p>
                )}
            </section>
        </div>
    );
};

export default Property;
