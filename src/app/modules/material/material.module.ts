import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    MatToolbarModule,
    MatIconModule,
    MatSidenavModule,
    MatButtonModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule, MatSelectModule, MatProgressBarModule
} from "@angular/material";

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
      MatToolbarModule,
      MatIconModule,
      MatSidenavModule,
      MatButtonModule,
      MatTooltipModule,
      MatFormFieldModule ,
      MatInputModule,
      MatSelectModule,
      MatProgressBarModule,
  ] ,
    exports : [
        MatToolbarModule,
	MatIconModule,
	MatSidenavModule,
	MatButtonModule,
	MatTooltipModule,
	MatFormFieldModule,
	MatInputModule,
	MatSelectModule,
	MatProgressBarModule,
    ]
})
export class MaterialModule { }
