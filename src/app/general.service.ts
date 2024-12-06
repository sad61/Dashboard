import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, throwError } from 'rxjs';
import { environment } from '../environment';

@Injectable({
  providedIn: 'root',
})
export class GeneralService {
  protected _guilds$: BehaviorSubject<Map<string, any>> = new BehaviorSubject(new Map<string, any>);
  private readonly userID = '370346029553287178';
  private _user$ = new BehaviorSubject<any>(null)
  protected guildCache = new Map<string, string>();

  constructor(private httpService: HttpClient) {
    this.getGuild();
    this.getUser();
  }

  get user$() {
    return this._user$.asObservable()
  }
  

  get guilds$() {
    return this._guilds$.asObservable();
  }

  public getGuildByID(id: string | null): string | undefined {
    if (id == null) return;
    return this.guildCache.get(id);
  }

  getUser() {
    this.httpService
      .get<any>(
        `${environment.API_ENDPOINT}/discord/user?userID=${this.userID}`
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching member data:', error.message);
          return throwError(() => new Error('Failed to fetch member data.'));
        })
      )
      .subscribe((data: any) => {
        this._user$.next(data)
      });
  }
  

  getGuild() {
    this.httpService
      .get<any>(
        `${environment.API_ENDPOINT}/discord/guilds?userID=${this.userID}`
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching guild data:', error.message);
          return throwError(() => new Error('Failed to fetch guild data.'));
        })
      )
      .subscribe((data: any) => {
        for (const d of data.guilds) {
          console.log(d.id, d.name)
          this.guildCache.set(d.id, d);
        }
        this._guilds$.next(this.guildCache)
      });
  }
}
