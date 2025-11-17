import Link from 'next/link';
import getUserSession from '@/lib/getUserSession';
import createSupabaseServerClient from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

const Header = async () => {
  const { data } = await getUserSession();

  const logoutAction = async () => {
    'use server';
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect('/auth/login');
  };

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <nav className='container h-16 flex items-center justify-between mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center space-x-8'>
          <Link href='/' className='flex items-center space-x-2'>
            <span className='font-bold text-lg text-primary'>
              Swalang Sandbox
            </span>
          </Link>
        </div>

        <div className='flex items-center space-x-2 sm:space-x-4'>
          {!data.session ? (
            <>
              <Link href='/auth/login' className='px-3 sm:px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors'>
                Login
              </Link>
              <Link href='/auth/register' className='px-3 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors'>
                Register
              </Link>
            </>
          ) : (
            <div className="flex items-center space-x-2 sm:space-x-4">
               <Link href='/profile' className='hidden sm:inline-block px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors'>
                 Profile
               </Link>
               <form action={logoutAction}>
                 <button className='px-3 sm:px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors'>
                    Logout
                 </button>
               </form>
            </div>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
};

export default Header;