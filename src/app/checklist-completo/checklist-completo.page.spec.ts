import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChecklistCompletoPage } from './checklist-completo.page';

describe('ChecklistCompletoPage', () => {
  let component: ChecklistCompletoPage;
  let fixture: ComponentFixture<ChecklistCompletoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ChecklistCompletoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
