import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InspecaoVeiculoPage } from './inspecao-veiculo.page';

describe('InspecaoVeiculoPage', () => {
  let component: InspecaoVeiculoPage;
  let fixture: ComponentFixture<InspecaoVeiculoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InspecaoVeiculoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
