import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, throwError } from 'rxjs';
import { environment } from '../environment';

@Injectable({
  providedIn: 'root',
})
export class GeneralService {
  protected _guilds$: BehaviorSubject<Map<string, any>> = new BehaviorSubject(new Map<string, any>);
  private readonly memberID = '370346029553287178';
  protected guildCache = new Map<string, string>();
  constructor(private httpService: HttpClient) {
    this.getGuild();
  }

  get guilds$() {
    return this._guilds$.asObservable();
  }

  public getGuildByID(id: string | null): string | undefined {
    if (id == null) return;
    return this.guildCache.get(id);
  }

  getGuild() {
    this.httpService
      .get<any>(
        `${environment.API_ENDPOINT}/discord/guilds?memberID=${this.memberID}`
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching guild data:', error.message);
          return throwError(() => new Error('Failed to fetch guild data.'));
        })
      )
      .subscribe((data: any) => {
        for (const d of data) {
          console.log(d.id, d.name)
          this.guildCache.set(d.id, d);
        }
        this._guilds$.next(this.guildCache)
      });
  }
}
