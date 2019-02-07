
namespace Ergo {
    const _p = Phoenix,
        _customData = _p.customData;
    class GridWithLink extends Phoenix.ui.FormController {
        public onModelChanged(action, model, form) {
            switch (action.property) {
                case 'Offres.$links.detail':
                    const item = action.actionParams;
                    form.navigate('demos/grid-selecting', {
                        canGoBack: true,
                        checkForChanges: false,
                        urlSearch: {
                            code: item.title
                        }
                    });
                    break;
                
            }

        }
    }
    _customData.register('demos.grid-link.controller', new GridWithLink());
}

