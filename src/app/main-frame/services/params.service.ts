import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Guild } from '../../interfaces/interface';

@Injectable({
  providedIn: 'root',
})
export class ParamsService {
  private _routeName!: string | null;
  private _routeID!: string | null;

  constructor(private route: ActivatedRoute) {
    this.route.firstChild?.paramMap.subscribe((params) => {
      this._routeName = params.get('name');
      this._routeID = params.get('id');
    });
  }

  get routeName() {
    return this._routeName;
  }

  get routeID() {
    return this._routeID;
  }

  get guild(): Guild {
    return {name: this._routeName ?? '', id: this._routeID ?? ''}
  }
}
