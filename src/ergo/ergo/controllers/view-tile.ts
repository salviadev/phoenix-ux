/// <reference types="@phoenix/phoenix-cli" />

namespace Ergo {
    const _p = Phoenix, _customData = _p.customData, _dom = _p.dom, _dsPlugin = _p.DatasetPlugin, _link = _p.link, _data = _p.data;
    class tableauSimple extends Phoenix.ui.FormController {
        public beforeSetModel(data) {
        }
        public onModelChanged(action, model, form) {
            switch (action.property) {
                case '$links.detail':
                    form.module.executeLink("link://detail-tile", {});
                 break;
            }
        }
    }
    _customData.register('ergo.view-tile.controller', new tableauSimple());
}

