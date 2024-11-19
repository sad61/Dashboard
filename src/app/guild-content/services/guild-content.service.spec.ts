import { TestBed } from '@angular/core/testing';

import { GuildContentService } from './guild-content.service';

describe('GuildContentService', () => {
  let service: GuildContentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GuildContentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
