import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StakeholderFormComponent } from './pages/stakeholder-form/stakeholder-form';

const routes: Routes = [
  {
    path: '',
    component: StakeholderFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StakeholdersRoutingModule { }