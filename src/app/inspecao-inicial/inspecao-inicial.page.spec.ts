import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InspecaoInicialPage } from './inspecao-inicial.page';

describe('InspecaoInicialPage', () => {
  let component: InspecaoInicialPage;
  let fixture: ComponentFixture<InspecaoInicialPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InspecaoInicialPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
