import { ReactNode, useEffect } from 'react';
import Header from './dashboard/Header';
import { useAppStore } from 'hooks/useAppStore';
import { useRouter } from 'next/router';

export default function OnboardingLayout({
    children,
}: {
    children: ReactNode;
}) {
    const states = useAppStore();

    const router = useRouter();

    useEffect(() => {
        if ((states?.user?.accountTypes?.length ?? 0) > 0) {
            router.replace('/onboarding/kyc');
        }
    }, [states?.user?.accountTypes, router]);

    return (
        <main className="max-w-screen-4xl mx-auto overflow-x-clip">
            <Header variant="onboarding" />
            <main className="bg-[#F8F8F9FA] min-h-[calc(100vh-96px)]">
                {children}
            </main>
        </main>
    );
}
