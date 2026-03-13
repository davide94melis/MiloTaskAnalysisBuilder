import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { LibraryPageComponent } from './library-page.component';
import { TaskLibraryService } from '../../core/tasks/task-library.service';

describe('LibraryPageComponent', () => {
  it('renders returned library cards', async () => {
    await TestBed.configureTestingModule({
      imports: [LibraryPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: TaskLibraryService,
          useValue: {
            listLibrary: () =>
              of({
                items: [
                  {
                    id: 'task-1',
                    title: 'Preparare lo zaino',
                    category: 'Routine scolastica',
                    contextLabel: 'Casa',
                    targetLabel: 'Classe',
                    supportLevel: 'Supportato',
                    visibility: 'private',
                    status: 'draft',
                    stepCount: 7,
                    lastUpdatedAt: '2026-03-13T10:15:30Z',
                    authorName: 'teacher@example.com'
                  }
                ],
                availableFilters: {
                  categories: ['Routine scolastica'],
                  contexts: ['Casa'],
                  targetLabels: ['Classe'],
                  authors: ['teacher@example.com'],
                  statuses: ['draft'],
                  supportLevels: ['Supportato']
                }
              }),
            createDraft: jasmine.createSpy('createDraft'),
            duplicateTask: jasmine.createSpy('duplicateTask')
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(LibraryPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Preparare lo zaino');
    expect(fixture.nativeElement.textContent).toContain('task');
  });

  it('reloads the library when filters change', async () => {
    const listLibrary = jasmine.createSpy('listLibrary').and.returnValue(
      of({
        items: [],
        availableFilters: {
          categories: [],
          contexts: [],
          targetLabels: [],
          authors: [],
          statuses: [],
          supportLevels: []
        }
      })
    );

    await TestBed.configureTestingModule({
      imports: [LibraryPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: TaskLibraryService,
          useValue: {
            listLibrary,
            createDraft: jasmine.createSpy('createDraft'),
            duplicateTask: jasmine.createSpy('duplicateTask')
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(LibraryPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    await fixture.componentInstance.updateFilters({
      search: 'routine',
      category: '',
      context: '',
      targetLabel: '',
      author: '',
      status: '',
      supportLevel: ''
    });

    expect(listLibrary).toHaveBeenCalledWith(
      jasmine.objectContaining({
        search: 'routine'
      })
    );
  });
});
