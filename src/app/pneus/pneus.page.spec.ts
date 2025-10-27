import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PneusPage } from './pneus.page';

describe('PneusPage', () => {
  let component: PneusPage;
  let fixture: ComponentFixture<PneusPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PneusPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
