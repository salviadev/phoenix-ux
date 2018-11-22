/// <reference types="@phoenix/phoenix-cli" />

namespace Ergo {
    const _p = Phoenix, _customData = _p.customData, _dom = _p.dom, _dsPlugin = _p.DatasetPlugin, _link = _p.link, _data = _p.data;
    class tableauSimple extends Phoenix.ui.FormController {
        public beforeSetModel(data) {
        }
        public onModelChanged(action, model, form) {      
        }
    }
    _customData.register('ergo.tableau-simple.controller', new tableauSimple());
}

