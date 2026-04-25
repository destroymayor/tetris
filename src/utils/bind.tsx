import { createElement, type ComponentType } from 'react';

/**
 * MVVM Binder HOC — connects a ViewController to its ViewModel.
 * The ViewModel hook receives the component's props and returns
 * the data/handlers the ViewController needs to render.
 */
export function bind<TProps, TViewModel extends object>(
  ViewController: ComponentType<TViewModel>,
  useViewModel: (props: TProps) => TViewModel,
) {
  const BoundComponent = (props: TProps) => {
    const viewModel = useViewModel(props);
    return createElement(ViewController, viewModel);
  };

  BoundComponent.displayName = `Bound(${
    ViewController.displayName || ViewController.name || 'Component'
  })`;

  return BoundComponent;
}
