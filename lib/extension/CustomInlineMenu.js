/**
 * Created by Fonov Sergei on 05.12.16.
 */

class runCustomInlineMenu extends global.Telegram.BaseScopeExtension {
    process(menuData, prevMessage, offset) {
        if(typeof menuData.title === 'undefined')
            throw Error('title is undefined')
        if(typeof menuData.items === 'undefined')
            throw Error('items is undefined')
        if(typeof prevMessage === "undefined" && offset)
            throw Error('prevMessage is undefined')

        if(typeof offset === 'undefined')
            offset = 0
        if(Array.isArray(menuData.items) && menuData.items.length == 1)
            menuData.items = menuData.items[0]


        let message = `<b>${menuData.title}</b>`, keyboard = [], callbackData = {}

        var InlineKeyboard = (buttons) => {
            buttons.forEach((arr) => {
                let array = []
                arr.forEach((buttons) => {
                    let random = Math.random().toString(36).substring(7)
                    array.push({
                        text: buttons.text,
                        callback_data: random
                    })
                    callbackData[random] = buttons.callback
                })
                keyboard.push(array)
            })
        }

        var prepareCallback = (response) => {
            let KeysCallbackData = Object.keys(callbackData)
            KeysCallbackData.forEach(data => {
                this.waitForCallbackQuery(data, query => {
                    if(typeof callbackData[data] === "function"){
                        try {
                            callbackData[data](query, response)
                        }
                        catch (e) {
                            this.logger.error({ 'error in user callback:': e })
                        }
                    }
                    if(typeof callbackData[data] === "object"){
                        try {
                            this.runCustomInlineMenu(menuData, {
                                chat_id: response.chat.id,
                                message_id: response.messageId
                            }, callbackData[data].offset)
                        }
                        catch (e) {
                            this.logger.error({ 'error in user callback:': e })
                        }
                    }
                })
            })
        }

        var PageInlineKeyboard = (number) => {
            let array = []
            if(number < 6){
                menuData.items.forEach((key, i) => {
                    let random = Math.random().toString(36).substring(7)
                    array.push({
                        text: (i == offset) ? `·${i+1}·` : `${i+1}`,
                        callback_data: random
                    })
                    callbackData[random] = {
                        offset: i
                    }
                })
                return keyboard.push(array)
            }else if(number > 5){
                for (let i = 0; 5 > i; i++) {
                    let page_number, newoffset;
                    if (offset < 3) {
                        switch (i){
                            case 3:
                                page_number = `${i+1}›`
                                newoffset = i
                                break
                            case 4:
                                page_number = `${number}»`
                                newoffset = number-1
                                break
                            default:
                                page_number = (i == offset) ? `·${i+1}·` : `${i+1}`
                                newoffset = i
                                break
                        }
                    }
                    else if (offset > number-4) {
                        switch (i){
                            case 0:
                                page_number = `«1`
                                newoffset = 0
                                break
                            case 1:
                                page_number = `‹${number-3}`
                                newoffset = number-4
                                break
                            case 2:
                                page_number = ((number-3) == offset) ? `·${number-2}·` : `${number-2}`
                                newoffset = number-3
                                break
                            case 3:
                                page_number = ((number-2) == offset) ? `·${number-1}·` : `${number-1}`
                                newoffset = number-2
                                break
                            case 4:
                                page_number = ((number-1) == offset) ? `·${number}·` : `${number}`
                                newoffset = number-1
                                break
                            default:
                                break
                        }
                    }
                    else{
                        switch (i){
                            case 0:
                                page_number = `«1`
                                newoffset = 0
                                break
                            case 1:
                                page_number = `‹${offset}`
                                newoffset = offset-1
                                break
                            case 2:
                                page_number = `·${offset+1}·`
                                newoffset = offset
                                break
                            case 3:
                                page_number = `${offset+2}›`
                                newoffset = offset+1
                                break
                            case 4:
                                page_number = `${number}»`
                                newoffset = number-1
                                break
                            default:
                                break
                        }
                    }
                    let random = Math.random().toString(36).substring(7)
                    array.push({
                        text: page_number,
                        callback_data: random
                    })
                    callbackData[random] = {
                        offset: newoffset
                    }
                }
                return keyboard.push(array)
            }
        }


        if(typeof menuData.items === "object" && !Array.isArray(menuData.items)){
            message += `\n${menuData.items.message}`;
            InlineKeyboard(menuData.items.menu)
        }
        if(typeof menuData.items === "object" && Array.isArray(menuData.items)){
            message += `\n${menuData.items[offset].message}`;
            PageInlineKeyboard(menuData.items.length)
            InlineKeyboard(menuData.items[offset].menu)
        }

        if(!prevMessage){
            this.api.sendMessage(this.chatId, message, {
                reply_markup: JSON.stringify({inline_keyboard: keyboard}),
                disable_web_page_preview: true,
                parse_mode: 'HTML'
            }).then(response => {
                prepareCallback(response)
            })
        }else {
            this.api.editMessageText(message, Object.assign(prevMessage, {
                reply_markup: JSON.stringify({inline_keyboard: keyboard}),
                disable_web_page_preview: true,
                parse_mode: 'HTML'
            })).then(response => {
                prepareCallback(response)
            })
        }
    }

    get name() {
        return 'runCustomInlineMenu'
    }
}

module.exports = runCustomInlineMenu