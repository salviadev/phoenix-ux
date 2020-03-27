/// <reference types="@phoenix/phoenix-cli" />
namespace Ergo {
    const _p = Phoenix,
        _customData = _p.customData;
    class tableauSimple extends Phoenix.ui.FormController {
        public onModelChanged(action, model, form) {
            switch (action.property) {
                case '$links.set':
                    model.Summary = [
                        {
                            "Name": "Total One",
                            "PV": 5872,
                            "Price": 25368
                        },
                        {
                            "Name": "Total Two",
                            "PV": 700,
                            "Price": 8000
                        }
                    ];
                    break;
                case '$links.upd':
                    model.Summary.get(0).Price = model.Summary.get(0).Price + 20;
                    model.Summary.get(0).PV = model.Summary.get(0).PV + 32;
                    break;
            }

        }
    }
    _customData.register('demos.grid-totals.controller', new tableauSimple());
}

