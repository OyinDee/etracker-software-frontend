import Button from 'components/base/Button';
import { useRouter } from 'next/router';
import renderEmptyState from 'pages/elements/EmptyState';

function PropertyHistory({ property }: { property: any }) {
    console.log(property, 'tenant property');

    if (!property) return renderEmptyState();
    return (
        <div className="w-full h-[300px] hidden-thin-scrollbar container">
            <table className="w-full whitespace-nowrap text-gray-700 border-separate font-[700]  text-center">
                <thead className="text-[#727070]">
                    <tr>
                        <th className="px-6 pl-0">Address</th>
                        <th className="px-6">Name</th>
                        <th className="px-6">State</th>
                        <th className="px-6 pr-0">Type</th>
                    </tr>
                </thead>

                <tbody>
                    {Array.isArray(property) ? (
                        property.map((prop: any) => (
                            <tr key={prop.id} className="capitalize">
                                <td className="p-6 pl-0">
                                    {prop.propertyAddress}
                                </td>
                                <td className="p-6">{prop.tenantName}</td>
                                <td className="p-6">{prop.tenantPhone}</td>
                                <td className="p-6 pr-0">
                                    {prop.propertyType || prop.apartmentType}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr key={property.id} className="capitalize">
                            <td className="p-6 pl-0">{property.address}</td>
                            <td className="p-6">{property.name}</td>
                            <td className="p-6">{property.location.state}</td>
                            <td className="p-6 pr-0">
                                {property.propertyType ||
                                    property.apartmentType}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default PropertyHistory;
