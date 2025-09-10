import { ReactNode, useEffect, useState } from 'react';
import Header from './Header';
import { useQuery } from 'react-query';
import { UserService } from 'services';
import { useAppStore } from 'hooks/useAppStore';
import { DialogModal } from 'components/base/DialogModal';
import { useRouter } from 'next/router';
import Loader from 'components/base/Loader';
import Sidebar from './SideBar';
import { Role } from 'utils/enums';
import ModalContent from 'components/dashboard/ModalContent';
import useAccountType from 'hooks/useAccountType';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);
    const [role, setRole] = useState<Role>(Role.Landlord);
    const states = useAppStore();
    const [isSidenavOpen, setSidenavOpen] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const { acctType } = useAccountType();

    const { data: userProfile, isLoading } = useQuery(
        'getUserProfile',
        UserService.getUser,
        {}
    );
    const closeModal = () => {
        if (
            states?.screen === 'kycCompleted' ||
            states?.screen === 'awaitApproval'
        ) {
            states?.setScreen('');
            setIsOpen(false);
            router.push('/dashboard/properties');
        } else {
            states?.setScreen('');
            setIsOpen(false);
        }
    };

    useEffect(() => {
        states?.screen && setIsOpen(!!states?.screen);
    }, [states?.screen]);

    const handleClose = () => {
        setIsOpen(false);
    };

    const toggleSidenav = (
        e: React.MouseEvent<HTMLButtonElement | SVGElement, MouseEvent>
    ) => {
        e.preventDefault();
        setSidenavOpen((isSidenavOpen) => !isSidenavOpen);
    };

    useEffect(() => {
        let mounted = true;

        const initializeUser = async () => {
            if (!isLoading && mounted) {
                if (userProfile) {
                    // First check: Redirect to onboarding if no account types
                    if (
                        !userProfile.accountTypes ||
                        userProfile.accountTypes.length === 0
                    ) {
                        router.replace('/onboarding');
                        return;
                    }

                    // Check if user data actually changed to prevent unnecessary updates
                    const currentUser = states?.user;
                    const userChanged =
                        JSON.stringify(currentUser) !==
                        JSON.stringify(userProfile);

                    if (userChanged) {
                        states?.setUser({ user: userProfile });
                    }

                    // Handle KYC status only if needed
                    const hasCurrentKyc = !!userProfile?.currentKyc;
                    const hasActiveKyc = !!states?.activeKyc;

                    if (hasCurrentKyc && !hasActiveKyc) {
                        states?.setActiveKyc(userProfile.currentKyc);
                        states?.setStep(userProfile.currentKyc.nextStage);
                    } else if (
                        !hasCurrentKyc &&
                        !hasActiveKyc &&
                        userProfile?.accountTypes?.includes(
                            states?.activeAccount
                        )
                    ) {
                        states?.setActiveKyc(undefined);
                        states?.setStep(1);
                    }
                } else {
                    // Only redirect if we're not already on the signin page
                    if (router.pathname !== '/auth/signin') {
                        states?.signout();
                        states?.resetTenantState();
                        router.replace('/auth/signin');
                    }
                }
            }
        };

        initializeUser();

        return () => {
            mounted = false;
        };
    }, [userProfile, isLoading, router, states]);

    useEffect(() => {
        if (acctType && acctType.accountType) {
            const accountType = acctType?.accountType.toLowerCase();
            switch (accountType) {
                case 'lordlord':
                    setRole(Role.Landlord);
                    break;
                case 'tenant':
                    setRole(Role.Tenant);
                    break;
                case 'landlord tenant':
                    setRole(Role.LandlordTenant);
                    break;
                case 'property agent tenant':
                    setRole(Role.PropertyAgentTenant);
                case 'property agent':
                    setRole(Role.PropertyAgent);
                    break;
                default:
                    setRole(Role.Landlord);
                    break;
            }
        }
    }, [acctType]);

    if (!isClient) return null;

    return isLoading ? (
        <Loader loading={isLoading} />
    ) : (
        <section className="min-h-screen bg-gray-50">
            <DialogModal
                openModal={isOpen}
                showClose={false}
                closeModal={closeModal}
            >
                <div className="w-full text-center text-[#131313] px-10">
                    <ModalContent
                        screenType={states?.screen}
                        closeModal={handleClose}
                    />
                </div>
            </DialogModal>

            {/* Mobile backdrop overlay */}
            {isSidenavOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-[99] md:hidden"
                    onClick={() => setSidenavOpen(false)}
                />
            )}

            <Sidebar
                role={role}
                isSidenavOpen={isSidenavOpen}
                setSidenavOpen={setSidenavOpen}
            />
            <section className="ml-0 md:ml-[234px] min-h-screen transition-all duration-300">
                <Header
                    isSidenavOpen={isSidenavOpen}
                    toggleSidenav={toggleSidenav}
                />
                <main className="bg-gray-50 pt-6 pb-16 px-4 md:px-8 min-h-[calc(100vh-80px)]">
                    {children}
                </main>
            </section>
        </section>
    );
}
