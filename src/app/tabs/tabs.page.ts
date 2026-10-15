import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonLabel } from '@ionic/angular';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonLabel],
})
export class TabsPage {}
