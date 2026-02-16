import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ElicitacionDashboard } from './pages/elicitacion-dashboard/elicitacion-dashboard';

const routes: Routes = [
  {
    path: '',
    component: ElicitacionDashboard
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ElicitacionRoutingModule {}
