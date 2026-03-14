import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
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
                    authorName: 'teacher@example.com',
                    variantFamilyId: null,
                    variantRootTaskId: null,
                    variantRootTitle: null,
                    variantRole: 'standalone',
                    variantCount: 1
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
    expect(fixture.nativeElement.textContent).toContain('Task singola');
    expect(fixture.nativeElement.textContent).toContain('Supportato');
    expect(fixture.nativeElement.textContent).toContain('Crea nuova task');
    expect(fixture.nativeElement.textContent).toContain('livello di supporto resta il segnale principale');
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

  it('keeps family cards visible and grouped while rendering standalone tasks', async () => {
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
                    id: 'variant-1',
                    title: 'Lavarsi le mani',
                    category: 'Autonomia personale',
                    contextLabel: 'Bagno',
                    targetLabel: 'Bambino',
                    supportLevel: 'Visivo',
                    visibility: 'private',
                    status: 'draft',
                    stepCount: 6,
                    lastUpdatedAt: '2026-03-13T10:10:30Z',
                    authorName: 'teacher@example.com',
                    sourceTaskId: 'root-1',
                    variantFamilyId: 'root-1',
                    variantRootTaskId: 'root-1',
                    variantRootTitle: 'Lavarsi le mani',
                    variantRole: 'variant',
                    variantCount: 3
                  },
                  {
                    id: 'standalone-1',
                    title: 'Preparare lo zaino',
                    category: 'Routine scolastica',
                    contextLabel: 'Casa',
                    targetLabel: 'Classe',
                    supportLevel: 'Autonomo',
                    visibility: 'private',
                    status: 'draft',
                    stepCount: 7,
                    lastUpdatedAt: '2026-03-13T09:15:30Z',
                    authorName: 'teacher@example.com',
                    variantRole: 'standalone',
                    variantCount: 1
                  },
                  {
                    id: 'root-1',
                    title: 'Lavarsi le mani',
                    category: 'Autonomia personale',
                    contextLabel: 'Bagno',
                    targetLabel: 'Bambino',
                    supportLevel: 'Guidato',
                    visibility: 'private',
                    status: 'draft',
                    stepCount: 6,
                    lastUpdatedAt: '2026-03-13T11:15:30Z',
                    authorName: 'teacher@example.com',
                    variantFamilyId: 'root-1',
                    variantRootTaskId: 'root-1',
                    variantRootTitle: 'Lavarsi le mani',
                    variantRole: 'root',
                    variantCount: 3
                  }
                ],
                availableFilters: {
                  categories: ['Autonomia personale', 'Routine scolastica'],
                  contexts: ['Bagno', 'Casa'],
                  targetLabels: ['Bambino', 'Classe'],
                  authors: ['teacher@example.com'],
                  statuses: ['draft'],
                  supportLevels: ['Guidato', 'Visivo', 'Autonomo']
                }
              }),
            createDraft: jasmine.createSpy('createDraft'),
            duplicateTask: jasmine.createSpy('duplicateTask'),
            createVariant: jasmine.createSpy('createVariant')
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(LibraryPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Task base');
    expect(text).toContain('Variante');
    expect(text).toContain('1 famiglie variante visibili');
    expect(text).toContain('Task singola');
    expect(text).toContain('Step');

    const titleNodes = Array.from<Element>(fixture.nativeElement.querySelectorAll('h4')).map((node) =>
      node.textContent?.trim()
    );
    expect(titleNodes.slice(0, 2)).toEqual(['Lavarsi le mani', 'Lavarsi le mani']);
  });

  it('creates a variant with explicit support-level input and opens the new task', async () => {
    const createVariant = jasmine.createSpy('createVariant').and.returnValue(
      of({
        id: 'variant-2',
        title: 'Lavarsi le mani',
        category: 'Autonomia personale',
        contextLabel: 'Bagno',
        targetLabel: 'Bambino',
        supportLevel: 'Autonomo',
        visibility: 'private',
        status: 'draft',
        stepCount: 6,
        lastUpdatedAt: '2026-03-14T10:15:30Z',
        authorName: 'teacher@example.com',
        sourceTaskId: 'root-1',
        variantFamilyId: 'root-1',
        variantRootTaskId: 'root-1',
        variantRootTitle: 'Lavarsi le mani',
        variantRole: 'variant',
        variantCount: 3
      })
    );

    await TestBed.configureTestingModule({
      imports: [LibraryPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: TaskLibraryService,
          useValue: {
            listLibrary: () =>
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
              }),
            createDraft: jasmine.createSpy('createDraft'),
            duplicateTask: jasmine.createSpy('duplicateTask'),
            createVariant
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(LibraryPageComponent);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(window, 'prompt').and.returnValue('Autonomo');

    fixture.detectChanges();
    await fixture.whenStable();

    await fixture.componentInstance.createVariant({
      id: 'root-1',
      title: 'Lavarsi le mani',
      category: 'Autonomia personale',
      contextLabel: 'Bagno',
      targetLabel: 'Bambino',
      supportLevel: 'Guidato',
      visibility: 'private',
      status: 'draft',
      stepCount: 6,
      lastUpdatedAt: '2026-03-13T11:15:30Z',
      authorName: 'teacher@example.com',
      variantFamilyId: 'root-1',
      variantRootTaskId: 'root-1',
      variantRootTitle: 'Lavarsi le mani',
      variantRole: 'root',
      variantCount: 3
    });

    expect(createVariant).toHaveBeenCalledWith('root-1', { supportLevel: 'Autonomo' });
    expect(router.navigate).toHaveBeenCalledWith(['/tasks', 'variant-2']);
  });
});
