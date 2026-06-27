import { Outlet } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { AppHeader } from '../widgets/app-header/AppHeader'
import { AppSidebar } from '../widgets/app-sidebar/AppSidebar'

export function MainLayout() {
    return <AppLayout sidebar={<AppSidebar />} header={<AppHeader />}>{<Outlet />}</AppLayout>
}