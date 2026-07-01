import type { ReactElement } from 'react'
import { Outlet } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { AppSidebar } from '../widgets/app-sidebar/AppSidebar'

export function MainLayout(): ReactElement {
  return (
    <AppLayout sidebar={<AppSidebar />}>
      <Outlet />
    </AppLayout>
  )
}
