import './style.css';
import './city.css';
import { mountCity } from './city';

document.querySelector('#shell')!.classList.add('city-shell');
mountCity(document.querySelector<HTMLElement>('#ui')!);
