/// <reference types="@phoenix/phoenix-cli" />
namespace PhoenixLib {
    const _p = Phoenix;
    let item_render = {
        render: function (parent, item, map, index) {
            map[item.id] = item.id;
            const html: string[] = [];
            html.push('<div id="' + item.id + '" class="accession-tile-div accession-tile-color-one"><div><h4 class="accession-tile-title">' + item.title.toUpperCase() + '</h4>');
            for (var i = 0; i < item.infos.length; i++) {

                if (item.infos[i]) {
                    if (item.infos[i].title) {
                        html.push('<div><p>' + item.infos[i].title + ' : ');
                        if (item.infos[i].value)
                            html.push(item.infos[i].value);
                        html.push('</p>');
                    }
                    else {
                        html.push('<div><p>' + item.infos[i].value + '</p>');
                    }
                }
            }
            parent.appendChild($(html.join('')).get(0));



        },
        click(event, map) {
        }

    }
    _p.customData.register("accession-resume-lot-render", item_render);
}