import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FotosVeiculoPage } from './fotos-veiculo.page';

describe('FotosVeiculoPage', () => {
  let component: FotosVeiculoPage;
  let fixture: ComponentFixture<FotosVeiculoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FotosVeiculoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
