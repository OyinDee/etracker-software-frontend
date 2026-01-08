import Button from 'components/base/Button';
import Input from 'components/base/form/Input';
import Select from 'components/base/form/Select';
import useTenant from 'hooks/useTenant';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useAppStore } from 'hooks/useAppStore';
import { toast } from 'react-hot-toast';
import { getSubscriptionStatus } from 'utils/subscriptionUtils';

interface receiptData {
    category: string;
    dueDate: string;
    amount: string;
    tenants: string[];
}

interface SendReceiptProps {
    setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
    selectedTenants: string;
}

const schema = yup.object({
    date: yup.date().required('Enter a date'),
    receipt: yup.string().required('Select a receipt type'),
    price: yup.number().required('Enter price'),
});

export default function SendReceipt({
    setOpenModal,
    selectedTenants,
}: SendReceiptProps) {
    const states = useAppStore();
    const {
        // getReceiptCategories,
        createTransaction,
        createTransactionLoading,
    } = useTenant();
    // const receiptCategories = getReceiptCategories?.data;
    const receiptCategories = [
        'Rent',
        'Water Bill',
        'Light Bill',
        'Waste Bill',
        'Security Bill',
        'Service Charge',
    ];

    const {
        handleSubmit,
        register,
        watch,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
    });

    const onSubmit = async (data: any) => {
        // Check if the user is subscribed
        // const subscriptionStatus = await getSubscriptionStatus(states?.user?.email || '');
        // if (subscriptionStatus !== 'active') {
        //     toast.error('You need an active subscription to perform this action.');
        //     return;
        // }

        const formData = new FormData();

        const reqObj: receiptData = {
            category: data.receipt,
            dueDate: new Date(data.date).toUTCString(),
            amount: data.price,
            tenants: states?.selectedTenants as string[],
        };

        for (const key in reqObj) {
            const value = reqObj[key as keyof receiptData];
            if (typeof value === 'number' || typeof value === 'string') {
                formData.append(key, value.toString());
            } else {
                formData.append(key, JSON.stringify(value));
            }
        }

        try {
            const res = await createTransaction(reqObj);
            console.log(res);
            if (res) {
                states?.resetTenantState();
                setOpenModal(false);
                toast.success(
                    'Transaction created and receipt email sent successfully'
                );
            }
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    console.log(selectedTenants);
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Input
                type="date"
                label="Date"
                placeholder="DD/MM/YY"
                asterisk
                required
                register={{ ...register('date') }}
                error={errors.date}
                inputClassName="bg-white"
                className="!mb-12"
            />

            <Select
                label="Receipt"
                placeholder="Choose receipt"
                required
                register={{ ...register('receipt') }}
                error={errors.receipt}
                selectDivClassName="bg-white"
                className="!mb-12"
            >
                <option value="">Choose receipt</option>
                {Array.isArray(receiptCategories) &&
                    receiptCategories?.map((cat, index) => (
                        <option key={index} value={cat}>
                            {cat}
                        </option>
                    ))}
            </Select>
            {/* <Input
                label="Receipt"
                required
                placeholder="Receipt"
                asterisk
                register={{ ...register('receipt') }}
                error={errors.receipt}
                inputClassName="bg-white"
            /> */}
            <Input
                label="Price"
                required
                placeholder="Price"
                asterisk
                register={{ ...register('price') }}
                error={errors.price}
                inputClassName="bg-white"
            />

            <div className="flex w-4/6 gap-5 col-span-2 mx-auto mt-16 mb-2">
                <Button
                    type="button"
                    onClick={() => {
                        setOpenModal(false);
                        states?.resetTenantState();
                    }}
                    variant="default"
                    className="w-full py-4"
                >
                    Cancel
                </Button>

                <Button
                    className="w-full py-4"
                    type="submit"
                    isLoading={createTransactionLoading}
                >
                    Send
                </Button>
            </div>
        </form>
    );
}
