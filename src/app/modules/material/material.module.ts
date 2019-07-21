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
    MatCardModule, MatAutocompleteModule, MatTabsModule,
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
      MatMenuModule,
      MatCardModule,
      MatAutocompleteModule,
      MatTabsModule,
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
    ]
})
export class MaterialModule { }
