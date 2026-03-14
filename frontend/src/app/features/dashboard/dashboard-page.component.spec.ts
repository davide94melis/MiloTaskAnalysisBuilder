import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { DashboardPageComponent } from './dashboard-page.component';
import { TaskLibraryService } from '../../core/tasks/task-library.service';

describe('DashboardPageComponent', () => {
  it('renders recent drafts and seed templates', async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: TaskLibraryService,
          useValue: {
            getDashboard: () =>
              of({
                recentDrafts: [
                  {
                    id: 'task-1',
                    title: 'Bozza recente',
                    category: 'Routine quotidiana',
                    contextLabel: 'Casa',
                    targetLabel: 'Bambino',
                    supportLevel: 'Visivo',
                    visibility: 'private',
                    status: 'draft',
                    stepCount: 6,
                    lastUpdatedAt: '2026-03-13T10:15:30Z',
                    authorName: 'teacher@example.com'
                  }
                ],
                seedTemplates: [
                  {
                    id: 'task-2',
                    title: 'Lavarsi le mani',
                    category: 'Autonomia personale',
                    contextLabel: 'Bagno',
                    targetLabel: 'Bambino',
                    supportLevel: 'Guidato',
                    visibility: 'template',
                    status: 'template',
                    stepCount: 7,
                    lastUpdatedAt: '2026-03-13T10:15:30Z',
                    authorName: 'Milo'
                  }
                ],
                stats: {
                  draftCount: 1,
                  templateCount: 1,
                  sharedCount: 0
                }
              }),
            createDraft: jasmine.createSpy('createDraft'),
            duplicateTask: jasmine.createSpy('duplicateTask')
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Crea nuova task');
    expect(text).toContain('Vai alla libreria');
    expect(text).toContain('Bozza recente');
    expect(text).toContain('Lavarsi le mani');
    expect(text).toContain('Bozze attive');
    expect(text).toContain('Partenze consigliate');
  });
});
