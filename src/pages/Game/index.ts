import { bind } from '@/utils/bind';
import { Game } from './Game.view-controller';
import { useGameViewModel } from './Game.view-model';

export default bind(Game, useGameViewModel);
