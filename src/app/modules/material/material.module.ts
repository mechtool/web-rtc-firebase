import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    MatToolbarModule,
    MatIconModule,
    MatSidenavModule,
    MatButtonModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    MatMenuModule,
    MatCardModule, MatAutocompleteModule, MatTabsModule, MatProgressSpinnerModule, MatSlideToggleModule,
} from "@angular/material";
import {LayoutModule} from "@angular/cdk/layout";

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
      MatMenuModule,
      MatCardModule,
      MatAutocompleteModule,
      MatTabsModule,
      MatProgressSpinnerModule,
      MatSlideToggleModule,
      LayoutModule,
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
	MatMenuModule,
	MatCardModule,
	MatAutocompleteModule,
	MatTabsModule,
	MatProgressSpinnerModule,
	MatSlideToggleModule,
	LayoutModule,
    ]
})
export class MaterialModule { }
