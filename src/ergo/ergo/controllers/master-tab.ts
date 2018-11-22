/// <reference types="@phoenix/phoenix-cli" />

namespace Ergo {
    const _p = Phoenix, _customData = _p.customData, _dom = _p.dom, _dsPlugin = _p.DatasetPlugin, _link = _p.link, _data = _p.data;
     class tableauSimple extends Phoenix.ui.FormController {
        public beforeSetModel(data) {
        }
        public onModelChanged(action, data, form) {
            var offres = $.extend(true, {}, data);
            switch (action.property) {
                case "Offres.$item.$links.remove":
                data.Offres.remove(action.actionParams);
                break;
            case "$links.setData":
                data.Offres = $.extend(true, {}, offres).Offres;
                break;
            case "$links.addLine":
                data.Offres.clearSelection();
                data.Offres.push({ $select: true, caracTA: {} });
                break;
            }
        }
    }
    _customData.register('ergo.master-tab.controller', new tableauSimple());
}

