import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { Guild } from '../interfaces/interface'

@Injectable({
  providedIn: 'root'
})
export class GuildService {

  guild$!: Subject<Guild>;
  private guild!: Guild

  constructor() { 
    this.guild$ = new Subject<Guild>;
  }

  getGuild$(): Subject<Guild> {
    return this.guild$
  }

  setNextGuild$(guild: Guild) {
    this.guild$.next(guild)
  }
}
