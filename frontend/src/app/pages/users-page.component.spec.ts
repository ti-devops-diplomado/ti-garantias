import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { UserSummary } from '../core/models';
import { UsersPageComponent } from './users-page.component';

describe('UsersPageComponent', () => {
  let fixture: ComponentFixture<UsersPageComponent>;
  let component: UsersPageComponent;

  const users: UserSummary[] = [
    {
      id: 'u1',
      fullName: 'Admin Demo',
      email: 'admin@test.local',
      isActive: true,
      roles: ['Admin']
    },
    {
      id: 'u2',
      fullName: 'Gestor Demo',
      email: 'gestor@test.local',
      isActive: false,
      roles: ['Gestor']
    }
  ];

  const apiMock = {
    getUsers: jasmine.createSpy('getUsers').and.returnValue(of(users)),
    saveUser: jasmine.createSpy('saveUser').and.returnValue(of(users[0])),
    updateUserStatus: jasmine.createSpy('updateUserStatus').and.returnValue(of(users[0])),
    resetUserPassword: jasmine.createSpy('resetUserPassword').and.returnValue(of({}))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ApiService, useValue: apiMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps the form closed by default and opens it for new users', () => {
    expect(component.showForm()).toBeFalse();

    component.openForm();

    expect(component.showForm()).toBeTrue();
  });

  it('filters users by search, role and status', () => {
    expect(component.filteredUsers().length).toBe(2);

    component.searchTerm.set('gestor');
    expect(component.filteredUsers().map(item => item.id)).toEqual(['u2']);

    component.searchTerm.set('');
    component.roleFilter.set('Admin');
    expect(component.filteredUsers().map(item => item.id)).toEqual(['u1']);

    component.roleFilter.set('');
    component.statusFilter.set('Inactivo');
    expect(component.filteredUsers().map(item => item.id)).toEqual(['u2']);
  });

  it('opens the form in edit mode and saves the selected user', () => {
    component.editUser(users[1]);

    expect(component.showForm()).toBeTrue();
    expect(component.editingUserId()).toBe('u2');
    expect(component.form.getRawValue().email).toBe('gestor@test.local');

    component.form.patchValue({
      fullName: 'Gestor Editado',
      email: 'gestor.editado@test.local',
      roles: ['Admin', 'Gestor'],
      password: ''
    });

    component.save();

    expect(apiMock.saveUser).toHaveBeenCalledWith(jasmine.objectContaining({
      fullName: 'Gestor Editado',
      email: 'gestor.editado@test.local',
      roles: ['Admin', 'Gestor'],
      password: ''
    }), 'u2');
  });
});
