/// <reference types="@phoenix/phoenix-cli" />

namespace Ergo {
    const _p = Phoenix, _customData = _p.customData, _dom = _p.dom, _dsPlugin = _p.DatasetPlugin, _link = _p.link, _data = _p.data;
    class tableauSimple extends Phoenix.ui.FormController {
        public beforeSetModel(data) {
        }
        public onModelChanged(action, model, form) {
            switch (action.property) {
                case '$links.$beforeEdit':
                    action.actionParams.$states.Type.isReadOnly = true;  
                    action.actionParams.$states.Libelle.isReadOnly = true;
                    break;
                case '$links.$afterUpdateChanges':
                    break;
            }
        }
    }
    _customData.register('ergo.detail-inside-tab.controller', new tableauSimple());
}

