/*
 *  Forever21 common.js
 */

var timeData = {
    homepageCarousel: '',
    dateNow: moment(),
    targetDate: moment('2018-04-04 00:00:00'),
    dateDiff: '',
    countdownTimer: ''
};

// -- Get resource json data from .resx files --
var getResourceData = function (resourceFileName, locale) {
    var retVal;
    executeAJAX("/Layout/GetResourceData/" + resourceFileName + "/" + locale, "GET", "JSON", null, false
        , function (response) {
            retVal = response;
        }
    );

    return retVal;
};

//-- Get Cookie --
var getCookie = function () {
    var cname = null;
    var pname = null;

    var ca = '';
    var name = '';

    if (arguments.length == 2) {
        cname = arguments[0];
        pname = arguments[1];

        var user = getCookie(cname);
        name = pname + "=";
        ca = user.split('&');
    }
    else if (arguments.length == 1) {
        cname = arguments[0];

        name = cname + "=";
        ca = document.cookie.split(';');
    }
    else {
        alert('Parameter Error');
        return;
    }

    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
};

var getCurrentLanguage = function () {
    var lang = getCookie('_cl' + COOKIE_POSTFIX);
    if (lang != null && (lang == '' || lang == 'undefined'))
        lang = 'en-US';
    return lang;
};

var COMMONRESOURCE = getResourceData('Common', getCurrentLanguage());

$(document).ready(function () {
    //Hide phoneOrder title
    if (getCookie('F21_Phone_Order') == '')
    {
        $('#divPhoneOrderTitle').hide();
    }

    if ($('.countdown_hour').length > 0) {
        // countdown script
        timeData.dateDiff = moment.duration(timeData.targetDate.diff(timeData.dateNow));

        // init countdown
        if (timeData.dateDiff > 0) {
            fnRemainTimer();
            // call function every 1 second
            timeData.countdownTimer = setInterval('fnRemainTimer()', 1000);
        }
    }

    // check basket/wishlist count;
    var basketCount = getCookie('UserTrace' + COOKIE_POSTFIX, 'basketCount');
    var wishListCount = getCookie('UserTrace' + COOKIE_POSTFIX, 'wishListCount');
    var currentUserId = fnGetUserId();
    var currentLang = getCurrentLanguage();
    // basketCount=0&wishListCount=0&basketSubTotal=0&firstLoadBasketCount=1

    if (wishListCount === '' || wishListCount === '0') {
        executeAJAX("/Account/GetWishlist", "POST", "JSON", { userId: currentUserId }, true
            , function (response) {
                if (response.ReturnCode == '00') {
                    var wishlistCount = 0;
                    if (response.WishListDetails) {
                        wishlistCount = response.WishListDetails.length;
                        // Create Wishlist cookie
                        fnUpdateWishlistCookie(response.WishListDetails);
                    }

                    setUserBasicData('', wishlistCount, '', 1);
                    fnSetHeaderWishListCount(wishlistCount);
                }
            }
        );
    }
    else {
        fnSetHeaderWishListCount(wishListCount);
    }

    //var commonResource = getResourceData('Common', currentLang);
    if (currentUserId != '' && getCookie("LoginCheck" + COOKIE_POSTFIX) == "Y") {
        // create 'UserTraceUS' cookie

        if (basketCount === '') {
            // Get basket count
            executeAJAX("/CheckOut/GetBasketCount", "POST", "JSON", { userId: currentUserId }, true
                , function (response) {
                    if (response.ReturnCode == '00') {
                        setUserBasicData(response.Count, '', '', 1);
                        fnSetHeaderBasketCount(response.Count);
                    }
                }
            );
        }
        else {
            fnSetHeaderBasketCount(basketCount);
        }

        //Mobile Left Menu User Status: Loggedin
        {
            $('#m_left_username').text(getItemFromJsonObject(COMMONRESOURCE, 'Key', 'lbMobileLeftMenu_MarkOfNextHelloText')[0].Value + ' ' + fnGetUserName());

            //Header User Status
            $('#w_header_status_area').html(
                getItemFromJsonObject(COMMONRESOURCE, 'Key', 'lbHello')[0].Value +
                getItemFromJsonObject(COMMONRESOURCE, 'Key', 'lbMobileLeftMenu_MarkOfNextHelloText')[0].Value +
                ' ' + fnGetUserName() +
                '<br>' + getItemFromJsonObject(COMMONRESOURCE, 'Key', 'lbHeaderStatus_YourAccount')[0].Value);

            $('#div_m_left_sign_link').html('<span onclick="fnLogOut(); return false;" class="underline t_normal">' + getItemFromJsonObject(COMMONRESOURCE, 'Key', 'lbSignOut')[0].Value + '</span>');
        }

        //Header MyAccount Slider
        {
            $('#ma_slider_username').text(getItemFromJsonObject(COMMONRESOURCE, 'Key', 'lbMobileLeftMenu_MarkOfNextHelloText')[0].Value + ' ' + fnGetUserName());
            if (fnGetMyPicture() != undefined && fnGetMyPicture() != '') {
                $('#myaccount_img .my_pic img').attr('src', SITE_PREFIX + '/_common/images/' + fnGetMyPicture());
            }

            $('#myaccount_guest').hide();
            $('#myaccount_user, #myaccount_img').show();
        }
    }
    //AnonymousUser
    else {
        //Basket count
        fnSetHeaderBasketCount(basketCount);
        //Wishlist count
        fnSetHeaderWishListCount(wishListCount);

        //Mobile Left Menu
        $('#m_left_username').text(getItemFromJsonObject(COMMONRESOURCE, 'Key', 'lbMobileLeftMenu_MarkOfNextHelloText')[0].Value + ' ' + getItemFromJsonObject(COMMONRESOURCE, 'Key', 'lbSignIn')[0].Value);
        $('#div_m_left_sign_link').html('');

        //Header MyAccount Slider
        $('#myaccount_guest').show();
        $('#myaccount_user, #myaccount_img').hide();
    }

    //prevent to disable spaces in password input box
    $(document).on('keydown', 'input[type=password]', function (e) {
        if (e.keyCode == 32) return false;
    });

    if (COOKIE_POSTFIX == "US") {
        $('#country_menu').hide();
    }

    $('#w_header_status_area').on('click', function () {
        if ($("#myaccount .r_container").hasClass('open')) {
            $("#myaccount .r_container, .desktop_overlay").removeClass("open");
            $("html").removeClass("noscroll");
        }
        else {
            $("#myaccount .r_container, .desktop_overlay:first").addClass("open");
            $("html").addClass("noscroll");
            $('.c_container').addClass('open left');
            $(".r_container .icon_close, .desktop_overlay").on("click", function () {
                $('.c_container').removeClass('open left');
            });
        }
    });

    //Special Offers Slide
    $('#specialOffers_slide').on('click', function () {
        var applyPromo = 'CODE: ' + getCookie('SOCOUPON');

        if ($("#open_specialOffers").hasClass("show")) {
            $(".desktop_overlay").removeClass("open black");
            $("#open_specialOffers").removeClass("show").addClass("hide");
            $("html").removeClass("noscroll");
            $(".soCouponPopClass").css('display', 'none');
        }
        else {
            $(".desktop_overlay:first").addClass("open black");
            $("#open_specialOffers").removeClass("hide").addClass("show");
            $("html").addClass("noscroll");

            $('#specialOffers_section > div').each(function (i, e) {
                if (applyPromo == $('#promo_code' + (i + 1) + '> a').html()) {
                    $('#promo_code' + (i + 1)).addClass('t_pink');
                }
            });
        }
    });

    //Check cookie popup
    fnCheckShowCookiePopup();

    //Show Searchbox on main page
    fnShowSearchBoxOnMain();

    $('#search_placeholder_mobile').on('click', function () {
        $(this).parent().find('input').focus();
    });

    // Add CSS class to header tag
    if (location.pathname.toLocaleLowerCase() === SITE_PREFIX || location.pathname.toLocaleLowerCase() === SITE_PREFIX + '/'
        || location.pathname.toLocaleLowerCase() === SITE_PREFIX + '/home/index' || location.pathname.toLocaleLowerCase() === SITE_PREFIX + '/home/index/')
        $('header').addClass('homepage');
    else
        $('header').addClass('subpage');

    //GTM Init
    fnInitGtmData();

    //GTM _cpua Init
    /*
    Capture product data in a product list. Should be called whenver an on-page list is retrieved and rendered
    @param {string} listName The name of the product list being loaded, see SDD for the appropriate listName for a given list
    @param {array} products An array of product objects which in this context, should have the following structure: 
    { name: [PRODUCT NAME], id: [PRODUCT ID], price: [UNIT PRICE], originalPrice: [REGULAR UNIT PRICE], brand: [BRAND], category: [CATEGORY] }
    @param {integer} pageNumber The page number of the results set
    */
    _cpua.productListLoaded = function (listName, products, pageNumber) {
        try {
            pageNumber = pageNumber || 1;
            // If the list already exists in the dataLayer: 
            // Clear the previous set of products
            // Adjust starting position 
            var pagesizeMatch = listName.match(/pagesize (\d+)/),
                pagesize = pagesizeMatch ? pagesizeMatch[1] : products.length,
                positionOffset = (pageNumber - 1) * pagesize,
                dlProductLists = typeof google_tag_manager !== 'undefined' ? google_tag_manager["GTM-NT47CNH"].dataLayer.get('productLists') : null;

            if (dlProductLists && dlProductLists[listName]) {
                dlProductLists[listName] = undefined;
                google_tag_manager["GTM-NT47CNH"].dataLayer.set('productLists', dlProductLists);
            }

            // Populate list name and position on each product object
            for (var i = 0; i < products.length; i++) {
                products[i].list = listName;
                products[i].position = i + positionOffset + 1;
            }
            var productListsObj = {};
            productListsObj[listName] = products;
            // Push product list into data layer for later events ie. product click
            dataLayer.push({
                productLists: productListsObj
            });
            // Chunk and send product impressions
            var chunkSize = 30;
            for (var i = 0; i < Math.ceil(products.length / chunkSize) ; i++) {
                dataLayer.push({
                    event: 'e_product_list_impressions',
                    listName: listName,
                    productImpressions: products.slice(i * chunkSize, (i + 1) * chunkSize),
                    eventCallback: function () {
                        dataLayer.push({
                            listName: null,
                            productImpressions: null
                        });
                    }
                });
            }
        } catch (e) {
            dataLayer.push({
                event: 'e_error',
                errorElement: '_cpua.productListLoaded(listName, products)',
                errorMessage: e.message
            });
        }
    };

    /*
      Capture product data related to a product detail page.
      @param {object} products A single or array of product objects.  In this context, the product object should have the following structure: { name: [PRODUCT NAME], id: [PRODUCT ID], price: [UNIT PRICE], originalPrice: [REGULAR UNIT PRICE], brand: [BRAND], category: [CATEGORY] }
    */
    _cpua.productDetailLoaded = function (products) {
        try {
            if (!Array.isArray(products)) {
                products = [products];
            }

            dataLayer.push({
                event: 'e_product_detail_loaded',
                page: {
                    product: {
                        id: products[0].id,
                        name: products[0].name
                    }
                },
                products: products,
                eventCallback: function () {
                    dataLayer.push({
                        products: null
                    });
                }
            });
        } catch (e) {
            dataLayer.push({
                event: 'e_error',
                errorElement: '_cpua.productDetailLoaded(products)',
                errorMessage: e.message
            });
        }
    };

    /*
      Record a checkout step.
      @param {number} stepNumber The step number of the checkout process
    */
    _cpua.checkoutStepsCompleted = _cpua.checkoutStepsCompleted || [];
    _cpua.checkoutStep = function (stepNumber) {
        try {
            if (_cpua.checkoutStepsCompleted.indexOf(stepNumber) === -1) {
                dataLayer.push({
                    event: 'e_checkout_step',
                    checkout: {
                        step: stepNumber
                    }
                });
                _cpua.checkoutStepsCompleted.push(stepNumber);
            }
        } catch (e) {
            dataLayer.push({
                event: 'e_error',
                errorElement: '_cpua.checkoutStep(stepNumber)',
                errorMessage: e.message
            });
        }
    };

    /*
      Capture data about cart contents on the basket page.
      @param {object} products An array of product objects.  In this context, the product object should have the following structure: { name: [PRODUCT NAME], id: [PRODUCT ID], price: [UNIT PRICE], originalPrice: [REGULAR UNIT PRICE], brand: [BRAND], category: [CATEGORY], variant: [SIZE] + ' | ' + [COLOR], quantity: [QUANTITY] }
    */
    _cpua.checkoutDetailLoaded = function (products) {
        try {
            dataLayer.push({
                event: 'e_checkout_detail_loaded',
                checkout: {
                    products: products
                }
            });
            _cpua.checkoutStep(1);
        } catch (e) {
            dataLayer.push({
                event: 'e_error',
                errorElement: '_cpua.checkoutDetailLoaded(products)',
                errorMessage: e.message
            });
        }
    };

    /*
      Check to see if transaction was already tracked (on this browser)
      @param {number} transactionID ID of the transaction
      @return {boolean} true if the transaction was already tracked, false otherwise
    */
    _cpua.transactionAlreadyTracked = function (transactionID) {
        var trackedTransactionIDStr = null;
        if (trackedTransactionIDStr = document.cookie.match(/_cpua_transaction_ids=([0-9,]+)(;|$)/)) {
            var trackedTransactionIDs = trackedTransactionIDStr[1].split(',');
            return trackedTransactionIDs.indexOf(transactionID.toString()) !== -1;
        }

        return false;
    };

    /*
      Record a transaction as tracked (on this browser)
      @param {number} transactionID ID of the transaction
    */
    _cpua.addToTrackedTransactions = function (transactionID) {
        var trackedTransactionIDStr = null,
            trackedTransactionIDs = [];
        if (trackedTransactionIDStr = document.cookie.match(/_cpua_transaction_ids=([0-9,]+)(;|$)/)) {
            trackedTransactionIDs = trackedTransactionIDStr[1].split(',');
        }

        trackedTransactionIDs.push(transactionID);
        document.cookie = '_cpua_transaction_ids=' + trackedTransactionIDs.join(',') + '; expires=' + (new Date(Date.now() + (5 * 365 * 24 * 60 * 60 * 1000))).toGMTString() + '; path=/';
    }

    /*
   Record a transaction.
    @param {number} transactionID ID of the transaction
    @param {number} tax Tax charged on the transaction
    @param {number} shipping Shipping charged on the transaction
    @param {number} total Gross total of the transaction inclusive of shipping and tax
    @param {object} products A single or array of product objects. In this context, the product object should have the following structure: { name: [PRODUCT NAME], id: [PRODUCTID], price: [UNIT PRICE], originalPrice: [REGULAR UNIT PRICE], brand: [BRAND], category: [CATEGORY], variant: [SIZE] + ' | ' + [COLOR], quantity: [QUANTITY], coupon: [COUPON], couponValue: [COUPON VALUE] }
    @param {string} coupon Transaction-level coupon used on the transaction if applicable
	@param {number} couponValue Value of the transaction-level coupon if one was applied.  Use positive values i.e. if the value of a coupon was $5.00, use 5.00.  Use 0 if there is no coupon.
    */
    _cpua.checkoutComplete = function (transactionID, tax, shipping, total, products, coupon, couponValue) {
        try {
            if (!_cpua.transactionAlreadyTracked(transactionID)) {
                var transaction = {
                    id: transactionID,
                    tax: tax,
                    shipping: shipping,
                    revenue: total,
                    products: products,
                    coupon: coupon,
                    couponValue: couponValue
                };
                dataLayer.push({
                    event: 'e_checkout_complete',
                    transaction: transaction,
                    version: '20180313',
                    servername: SERVER_NAME
                });
                _cpua.addToTrackedTransactions(transactionID);
            }
        } catch (e) {
            dataLayer.push({
                event: 'e_error',
                errorElement: '_cpua.checkoutComplete(transactionID, tax, shipping, total, products, coupon, couponValue)',
                errorMessage: e.message
            });
        }
    };

    /*
      Capture data about on-page promotions.
      @param {object} promotions An array of promotion objects.  In this context, the promotion object should have the following structure: { name: [PROMO NAME], id: [PROMO ID], creative: [PROMO CREATIVE], position: [PROMO PLACEMENT] }
    */
    _cpua.promotionsLoaded = function (promotions) {
        try {
            var promotionSlotImpressionsArr = [],
                promotionsObj = {};
            // push individual promotions onto the promotions object
            for (var i = 0; i < promotions.length; i++) {
                promotionSlotImpressionsArr.push(promotions[i]);
                promotionsObj[promotions[i].position] = promotions[i];
            }

            dataLayer.push({
                event: 'e_promotions_loaded',
                promotionSlotImpressions: promotionSlotImpressionsArr,
                promotionSlots: promotionsObj,
                eventCallback: function () {
                    dataLayer.push({
                        promotionSlotImpressions: null
                    });
                }
            });
        } catch (e) {
            dataLayer.push({
                event: 'e_error',
                errorElement: '_cpua.promotionsLoaded(promotions)',
                errorMessage: e.message
            });
        }
    };

    //Define creditCardSignupSuccess()
    _cpua.creditCardSignupSuccess = function () {
        dataLayer.push({
            'event': 'e_credit_card_signup_success'
        });
    };

    _cpua.creditCardSignupFail = function () {
        dataLayer.push({
            'event': 'e_credit_card_signup_fail'
        });
    };

    /*
    Capture data about cart contents on the basket page.
    @param {object} products An array of product objects. In this context, the product object
    should have the following structure: { name: [PRODUCT NAME], id: [PRODUCT ID], price: [UNIT
    PRICE], originalPrice: [REGULAR UNIT PRICE], brand: [BRAND], category: [CATEGORY], variant:
    [SIZE] + ' | ' + [COLOR], quantity: [QUANTITY] }
    */
    _cpua.basketDetailLoaded = function (products) {
        try {
            dataLayer.push({
                event: 'e_basket_detail_loaded',
                basket: {
                    products: products
                }
            });
        } catch (e) {
            dataLayer.push({
                event: 'e_error',
                errorElement: '_cpua.basketDetailLoaded(products)',
                errorMessage: e.message
            });
        }
    };

    fnSetGtmHomePromotionHeader();

    if (typeof fnSendBloomreachData != 'undefined' && $.isFunction(fnSendBloomreachData)) {
        fnSendBloomreachData('init');
    }

    //specialOffersSlideRending('#specialOffers_section', '3', '1', '4');

});

var fnRemainTimer = function () {
    var d = new Date();

    var days = timeData.dateDiff.get('days');
    var hours = timeData.dateDiff.get('hours');

    if (days > 0) {
        hours = (days * 24) + hours;
    }

    if (hours < 10) {
        hours = "0" + hours;
    }
    var minutes = timeData.dateDiff.get('minutes');
    if (minutes < 10) {
        minutes = "0" + minutes;
    }

    var seconds = timeData.dateDiff.get('seconds');
    if (seconds < 10) {
        seconds = "0" + seconds;
    }

    $('.countdown_hour').html(hours);
    $('.countdown_minute').html(minutes);
    $('.countdown_second').html(seconds);

    //$('.flash_timer').html("<div class=\"hour\"><p>" + hours + "</p><p>hours</p></div><div class=\"timer_divided\">:</div><div class=\"minutes\"><p>" + minutes + "</p><p>minutes</p></div><div class=\"timer_divided\">:</div><div class=\"second\"><p>" + seconds + "</p><p>seconds</p></div>");

    if (timeData.dateDiff < 1) {
        clearInterval(timeData.countdownTimer);
        //$('.flash_timer').html('Completed');
    } else {
        timeData.dateDiff.add(-1000);
    }
}
var fnInitGtmData = function () {
    var visitor = fnGetAcctInfoFromCookie();
    var visitorID = visitor.Id;
    var loginState = (fnIsLoggedIn() == true) ? 'Logged In' : 'Not Logged In';
    var customerID = visitor.Id;
    var gender = (function () {
        if (visitor.Gender == '1')
            return 'Female';
        else if (visitor.Gender == '2')
            return 'Male';
        else
            return 'Unknown';
    })();

    var type = fnReturnDataLayerType('type');
    var brand = fnReturnDataLayerbrand('brand');
    var category = fnReturnDataLayerCategory('category');
    var region = COOKIE_POSTFIX;
    var language = (getCookie('_cl' + COOKIE_POSTFIX) == '' || getCookie('_cl' + COOKIE_POSTFIX) == 'en-IE' ) ? 'en' : getCookie('_cl' + COOKIE_POSTFIX);
    var currency = (function () {
        if (COOKIE_POSTFIX == 'US')
            return 'USD';
        else if (COOKIE_POSTFIX == 'CA')
            return 'CAD';
        else if (COOKIE_POSTFIX == 'EU')
            return 'EUR';
        else if (COOKIE_POSTFIX == 'UK')
            return 'GBP';
        else
            return 'USD';
    })();

    dataLayer.push({
        event: 'baseDataLayerLoaded',
        visitor: {
            visitorID: visitorID,
            loginState: loginState,
            customerID: customerID,
            gender: gender
        },
        page: {
            type: type,
            brand: brand,
            category: category,
            region: region,
            language: language,
            currency: currency
        }
    });
};


var fnSetGtmHomePromotionHeader = function () {

    var promotions = [];
    try {
        if (_cpua.promotionsLoaded && typeof _cpua.promotionsLoaded === "function") {
            $('.gtm_promo').each(function (index, item) {
                if (item.dataset.promoPosition.toLowerCase().indexOf("homepage") > -1) {
                    promotions.push({
                        id: item.dataset.promoId,
                        name: item.dataset.promoName,
                        position: item.dataset.promoPosition
                    });
                    return false;
                }
            });
            _cpua.promotionsLoaded(promotions);
        }
    }
    catch (err)
    { }
}

var fnReturnDataLayerType = function () {
    var url = location.href.toLowerCase();

    if (url.indexOf('category') > 1)
        return 'product category';
    else if (url.indexOf('search') > 1)
        return 'search results';
    else if (url.indexOf('product') > 1)
        return 'pdp';
    else if (url.indexOf('basket') > 1)
        return 'cart';
    else if (url.indexOf('checkout') > 1)
        return 'payment';
    else if (url.indexOf('shop') > 1)
        return 'home';
    else
        return '';
};

var fnReturnDataLayerbrand = function () {
    var url = location.href.toLowerCase();

    var type = fnReturnDataLayerType();

    if (type == 'product category') {
        return category.fnGetCategoryBrand();
    }
    else if (type == 'pdp') {
        return fnGetProductBrand();
    }
    else {
        return '';
    }
};

var fnReturnDataLayerCategory = function () {
    var url = location.href.toLowerCase();

    var type = fnReturnDataLayerType();

    if (type == 'product category') {
        return category.fnGetCategoryName();
    }
    else if (type == 'pdp') {
        return fnGetProductCategoryName();
    }
    else {
        return '';
    }
};

$(window).on("beforeunload", function () {
    //페이지에서 나갈 때 발생하는 이벤트.
    //포지션을 sessionStorage 에 저장합니다.
    fnSetNavigation();
});

// According to header type, Set basket count
var fnSetHeaderBasketCount = function (basketCount) {
    // class case : BasketCountHeader
    if ($('.BasketCountHeader:not(.top_count)').length > 0) {
        $('.BasketCountHeader').html(basketCount > 0 ? basketCount : 0).show();
    }
        // class case : top_count BasketCountHeader
    else {
        if (basketCount > 0)
            $('.BasketCountHeader').html(basketCount).show();
        else
            $('.BasketCountHeader').hide();
    }
};

// According to header type, Set wishlist count
var fnSetHeaderWishListCount = function (wishlistCount) {
    // class case : WishlistCountHeader
    if ($('.WishlistCountHeader:not(.top_count)').length > 0) {
        $('.WishlistCountHeader').html(wishlistCount > 0 ? wishlistCount : 0).show();
        $('.m_header').find('.WishlistCountHeader').html(wishlistCount > 0 ? wishlistCount : '').show();
    }
        // class case : top_count WishlistCountHeader
    else {
        if (wishlistCount > 0)
            $('.WishlistCountHeader').html(wishlistCount).show();
        else
            $('.WishlistCountHeader').hide();
    }
};

var fnShowSearchBoxOnMain = function () {
    var currentUrl = window.location.pathname;
    if (currentUrl.toLowerCase() === '/us/shop/' || currentUrl.toLowerCase() === '/us/shop')
        $('.m_search_container').slideToggle();
};

//-- Set Cookie --
var setCookie = function (cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires + "; path=/";
};

//-- Delete Cookie --
var deleteCookie = function (cname) {
    var expireDate = new Date();

    expireDate.setDate(expireDate.getDate() - 1);
    document.cookie = cname + "= ; expires=" + expireDate.toGMTString() + "; path=/";
};


//SpecialOffers Slide
var specialOffersSlideRending = function (container, sort, page, pageSize) {
    executeAJAX("/Info/GetSpecialOffers", "POST", "JSON", { sort: sort, page: page, pageSize: pageSize }, true,
                    function (result) {
                        console.log(result);
                        if (result.ReturnCode == "00") {
                            fnLoadTemplate('/info/specialOffersSlide.html'
                             , function (data) {
                                 fnRenderHTML(container, data, result.specialOffers,
                                    {
                                        ConvertDateFormat: fnConvertDateFormat,
                                        GetImageLink: fnGetImageLink,
                                        ReturnPromoCode: fnReturnPromoCode,
                                        ConvertDisclaimer: fnConvertDisclaimer,
                                        ConvertTitle: fnConvertTitle
                                    }, null, false);
                             },
                             null);
                        }
                    },
                    function (result) {
                        console.log(result);
                    }, true);

    
};

//SpecialOffers Slide
 var fnSeeMoreSlide = function (desc, title) {
     $.flexModal.add('#special_msg_pop', function () {
        var $modalContent = $(this).children();
        $modalContent.html('');

        var response = { 
        };
        response.Title = title;
        response.Contents = desc;

        fnLoadTemplate('/info/specialOffersSeeMore.html',
            function (data) {
                var helpers = {};

                fnRenderHTML($modalContent, data, response, helpers);
            }, null, null
        );

        $("#special_msg_pop").addClass("flex-modal-item flex-modal-item--ready flex-modal-item--visible");
    });
 };

 var fnConvertDateFormat = function (date) {

     var dayIndex = date.indexOf(' ');
     date = date.substring(0, dayIndex);
     
     return date;
};

var fnGetImageLink = function (imagePath) {
     return SITE_IMAGEPATH + imagePath;
};

var fnReturnPromoCode = function (promoCode,num) {
    if (promoCode.indexOf(" ") != -1) {
        return "CODE: " + promoCode.toUpperCase();
    }
    else {
        return '<a href="javascript:fnApplySpecialOfferCoupon(\'' + promoCode + '\',\'' + num + '\');">CODE: ' + promoCode.toUpperCase() + '</a>';
    }
};

var fnConvertDisclaimer = function (desc) {
    desc = desc.replace('"', '').replace('"', '').replace("'",'');
    return desc;
};

var fnConvertTitle = function (title1, title2) {
    title1 = title1.replace('"', '').replace('"', '').replace("'", '');
    title2 = title2.replace('"', '').replace('"', '').replace("'", '');
    return title1+ ' ' + title2;
};

var fnApplySpecialOfferCoupon = function (promoCode, num) {
    var duplPink = false;
    var popId = $('#soCouponPop'+num);
    var promoId = $('#promo_code'+num);

    popId.css('display', 'block');
    if (promoId.hasClass('t_pink'))
    {
        promoId.removeClass('t_pink');
        deleteCookie("SOCOUPON");
        popId.html('This offer has been removed from your cart.');
        if (location.href.toLowerCase().indexOf('basket') > -1) {
            $('.expand_p').toggleClass('active');
            $('.expand_p').next().slideToggle();
            $('#txt_promoCode').val('');
        }
    }
    else
    {
        $('#specialOffers_section > div').each(function (i, e) {
            if ($('#promo_code' + (i + 1)).hasClass('t_pink')) {
                $('#promo_code' + (i +1)).removeClass('t_pink');
                deleteCookie("SOCOUPON");
                $('#soCouponPop' +(i +1)).html('This offer has been removed from your cart.');
                $('#soCouponPop' + (i + 1)).css('display', 'block');
                setTimeout(function () {
                    $('#soCouponPop' +(i +1)).css('display', 'none')
                }, 3000);
            }
        });

        promoId.addClass('t_pink');
        setCookie("SOCOUPON", promoCode, 1);
        popId.html('This offer has been applied to your cart.');
        if (location.href.toLowerCase().indexOf('basket') > -1) {
            if ($('#txt_promoCode').val() == ''){
                $('.expand_p').toggleClass('active');
                $('.expand_p').next().slideToggle();
                $('.input_label').addClass('focus');
            }
            $('#txt_promoCode').val(getCookie("SOCOUPON"));
        }
        
    }
    setTimeout(function () { popId.css('display', 'none')
    },3000);
};

 // -- get item from json object --
var getItemFromJsonObject = function (obj, key, val) {
    var objects =[];
    if (val != null) {
        for (var i in obj) {
            if (!obj.hasOwnProperty(i)) continue;
            if (typeof obj[i]== 'object') {
        objects = objects.concat(getItemFromJsonObject(obj[i], key, val));
    } else if (i == key && obj[key]== val) {
        objects.push(obj);
    }
}

        return objects;
    }
    else {
        var name;

        $.each($.category.resourceData, function (index, value) {
            if (value.Key == key) {
        name = value.Value;
                return false;
    }
    });

        return name;
}
};

var fnShuffleArray = function (sourceArray) {
    for (var i = 0; i < sourceArray.length -1; i++) {
        var j = i +Math.floor(Math.random() * (sourceArray.length -i));

        var temp = sourceArray[j];
        sourceArray[j]= sourceArray[i];
        sourceArray[i]= temp;
        }
    return sourceArray;
    }


var getUrlParameter = function getUrlParameter() {
    if (arguments.length == 1) {
        var sPageURL = decodeURIComponent(window.location.search.substring(1).toLowerCase()),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0]=== arguments[0]) {
                return sParameterName[1] === undefined ? true: sParameterName[1];
}
}
    }
    else if (arguments.length == 2) {
        var sPageURL = decodeURIComponent(arguments[0].substring(1)),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0].toLowerCase() === arguments[1].toLowerCase()) {
                return sParameterName[1].toLowerCase() === undefined ? true: sParameterName[1].toLowerCase();
    }
 }
    }
    };

var fnUpdateWishlistCookie = function (wishlistData) {
    var wishlistCount = 0;

    if (wishlistData) {
        var arrItems =[];
        wishlistCount = wishlistData.length;

        $(wishlistData).each(function () {
            arrItems.push({
                    ID: this.ProductId,
                    VID: this.VariantId,
                    LID: this.LineItemId,
                    Q: this.Quantity,
                    PC: this.CategoryName
        });
    });

        // wishlist cookie
        setCookie('WishListData' +COOKIE_POSTFIX, JSON.stringify(arrItems), 365);
        // user basic cookie
        setUserBasicData('', wishlistCount, '', 1);
    }
    else {
        setCookie('WishListData' +COOKIE_POSTFIX, '', 365);
        // user basic cookie
        setUserBasicData('', 0, '', 1);
}

    // set header wishlist icon
    $('.WishlistCountHeader').html(wishlistCount);

    if (wishlistCount > 0)
        $('.WishlistCountHeader').show();
    else
        $('.WishlistCountHeader').hide();
        };

var setUserBasicData = function (basketCount, wishlistCount, basketTotal, firstLoadBasketCount) {
    if (basketCount === '')
        basketCount = getCookie('UserTrace' +COOKIE_POSTFIX, 'basketCount');

    if (wishlistCount === '')
        wishlistCount = getCookie('UserTrace' +COOKIE_POSTFIX, 'wishListCount');

    if (basketTotal === '')
        basketTotal = getCookie('UserTrace' +COOKIE_POSTFIX, 'basketSubTotal');

    if (basketCount === '')
        basketCount = 0;

    if (wishlistCount === '')
        wishlistCount = 0;

    if (basketTotal === '')
        basketTotal = 0;

    var cookieVal = 'basketCount=' + basketCount
        + '&wishListCount=' + wishlistCount
        + '&basketSubTotal=' + basketTotal
        + '&firstLoadBasketCount=' +firstLoadBasketCount;
    setCookie('UserTrace' +COOKIE_POSTFIX, cookieVal, 365);
    };

var AcctInfoCookieName = 'UP' +COOKIE_POSTFIX;
     //------ set user info ------//
     var fnSetAccntInfoDataCookie = function (isReset, id, firstName, lastName, email, gender, guest, preferredAddress, profileImage) {
         var content = { };
         if (!isReset && getCookie(AcctInfoCookieName) != '') {
             var decryptedText = '';

             try {
                 decryptedText = sjcl.decrypt("forever21", getCookie(AcctInfoCookieName));
        }
        catch (e) {
            decryptedText = getCookie(AcctInfoCookieName);
        }

             content = JSON.parse(decryptedText);

             if (getCookie("LoggedUser" + COOKIE_POSTFIX) === '')
                 setCookie("LoggedUser" + COOKIE_POSTFIX, content.Id, 365);
         }
         else {
             content = {
                 Id: '',
                 FirstName: '',
                 LastName: '',
                 Email: '',
                 Gender: '',
                 Guest: '',
                 PreferredAddress: '',
                 ProfileImage: ''
     };
    }

    if (id !== '')
             content.Id = id;

         if (firstName !== '')
             content.FirstName = firstName;

         if (lastName !== '')
             content.LastName = lastName;

         if (email !== '')
             content.Email = email;

         if (gender !== '')
             content.Gender = gender;

         if (guest !== '')
             content.Guest = guest;

         if (preferredAddress !== '')
             content.PreferredAddress = preferredAddress;

         if (profileImage !== '')
             content.ProfileImage = profileImage;

         var encryptedText = sjcl.encrypt("forever21", JSON.stringify(content));
         //var encryptedText = JSON.stringify(content);
         setCookie(AcctInfoCookieName, encryptedText, 365);
         };

     var fnGetAcctInfoFromCookie = function () {
         var content = { };
         if(getCookie(AcctInfoCookieName) != '') {
             var decryptedText = '';

             try {
                 decryptedText = sjcl.decrypt("forever21", getCookie(AcctInfoCookieName));
        }
        catch (e) {
            decryptedText = getCookie(AcctInfoCookieName);
        }

             content = JSON.parse(decryptedText);
             if (getCookie("LoggedUser" + COOKIE_POSTFIX) === '')
                 setCookie("LoggedUser" + COOKIE_POSTFIX, content.Id, 365);

         }
         else {
             content = {
                 Id: '',
                 FirstName: '',
                 LastName: '',
                 Email: '',
                 Gender: '',
                 Guest: '',
                 PreferredAddress: '',
                 ProfileImage: ''
     };
     }
    return content;
    }

var fnUpdateMyPictureCookie = function (img) {
    var content = { };
    if(getCookie(AcctInfoCookieName) != '') {
        var decryptedText = '';

        try {
            decryptedText = sjcl.decrypt("forever21", getCookie(AcctInfoCookieName));
        }
        catch (e) {
            decryptedText = getCookie(AcctInfoCookieName);
        }

        content = JSON.parse(decryptedText);
    }
    else {
        content = {
            Id: '',
            FirstName: '',
            LastName: '',
            Email: '',
            Gender: '',
            Guest: '',
            PreferredAddress: '',
            ProfileImage: ''
};
}
content.ProfileImage = img;

var encryptedText = sjcl.encrypt("forever21", JSON.stringify(content));
setCookie(AcctInfoCookieName, encryptedText, 365);
}

var fnChangeLanguage = function (lang) {
    var modifiedLang = '';
    if (lang.toLowerCase() === 'en-ie')
        modifiedLang = 'en';
    else
        modifiedLang = lang;

    setCookie('_cl' +COOKIE_POSTFIX, lang, 365);

    var hash = '';
    var locationHref = window.location.href;

    if (location.hash != '') {
        hash = location.hash;
        locationHref = locationHref.replace(hash, '');
    }

    if (window.location.href.indexOf("lang=") > -1) {
        window.location.href = locationHref.substring(0, locationHref.indexOf("lang=")) + "lang=" + modifiedLang +hash;
    } else {
        if (locationHref.indexOf("?") > -1) {
            window.location.href = locationHref + "&lang=" + modifiedLang +hash;
        }
        else {
            window.location.href = locationHref + "?lang=" + modifiedLang +hash;
        }
     }
 };

var fnRemoveDOM = function (id) {
    $('#' +id).remove();
    }

var fnImgError = function (img) {
    img.src = SITE_PREFIX + '/_common/images/c_loading.gif';
    }

    function executeCategoryAJAX() {
        var url = null;
        var type = "POST";
        var contentType = "application/json";
        var data = null;
        var successFunction = null;

        if (true) {
            $('.loading').show();
    }

    url = arguments[0];
    data = arguments[1];
    successFunction = arguments[2];

    $.ajax({
        url : SITE_PREFIX +url,
    type: type,
        contentType: contentType,
    data: data,
    aysncType: true,
    dataType: "JSON",
            success: function (result) {
        successFunction(result);
        $('.loading').hide();
        },
            error: function (e) {
                $('.loading').hide();
 }
    });
    };

    function executeAJAXToModel() {
        var url = null;
        var type = "POST";
        var contentType = "application/json";
        var data = null;
        var successFunction = null;
        var errorFunction = null;
        var isLoadingOpt = null;

        if (true) {
            $('.loading').show();
    }

    url = arguments[0];
    data = arguments[1];
    successFunction = arguments[2];
    errorFunction = arguments[3];
    isLoadingOpt = arguments[4];

    $.ajax({
        url : SITE_PREFIX +url,
    type: type,
        contentType: contentType,
    data: data,
    aysncType: true,
    dataType: "JSON",
            success: function (result) {
                if (successFunction) {
                    successFunction(result);
            }
            else {
                //alert(result);
        }
        $('.loading').hide();
        },
            error: function (e) {
                if (errorFunction) {
                    errorFunction(e);
        }

            if (isLoadingOpt)
                $('.loading').hide();
 }
 });
 };

     //-- AJAX JQuery overloading function --
     //How to use ->
     //executeAJAX('/catalog/category', 'POST', 'JSON', {name:"sijun",age:"28"});
     //executeAJAX('/catalog/category', 'POST', 'JSON', {name:"sijun",age:"28"}, true);
     //executeAJAX('/catalog/category', 'POST', 'JSON', {name:"sijun",age:"28"}, true, function(names) { console.log(name) });
     function executeAJAX() {
         var url = null;
         var type = null;
         var dataType = null;
         var data = null;
         var asyncType = null;
         var successFunction = null;
         var errorFunction = null;
         var isLoadingOpt = null;

         if (arguments.length >= 9 || arguments.length < 3) {
             return alert("Parameter Error");
    }
    else if (arguments.length == 8) {
        url = arguments[0];
        type = arguments[1];
        dataType = arguments[2];
        data = arguments[3];
        asyncType = arguments[4];
        successFunction = arguments[5];
        errorFunction = arguments[6];
        isLoadingOpt = arguments[7];
    }
    else if (arguments.length == 7) {
        url = arguments[0];
        type = arguments[1];
        dataType = arguments[2];
        data = arguments[3];
        asyncType = arguments[4];
        successFunction = arguments[5];
        errorFunction = arguments[6];
    }
    else if (arguments.length == 6) {
        url = arguments[0];
        type = arguments[1];
        dataType = arguments[2];
        data = arguments[3];
        asyncType = arguments[4];
        successFunction = arguments[5];
    }
    else if (arguments.length == 5) {
        url = arguments[0];
        type = arguments[1];
        dataType = arguments[2];
        data = arguments[3];
        asyncType = arguments[4];
    }
    else if (arguments.length == 4) {
        url = arguments[0];
        type = arguments[1];
        dataType = arguments[2];
        data = arguments[3];
        asyncType = true;
    }
    else {
        url = arguments[0];
        type = arguments[1];
        dataType = arguments[2];
        data = "GET";
        asyncType = true;
    }

    if (isLoadingOpt)
        $('.loading').show();

    if(url.indexOf('http') < 0)
        url = SITE_PREFIX +url;

    $.ajax({
    url: url,
    type: type,
    dataType: dataType,
    data: data,
    async: asyncType,
            success: function (result) {
                if (successFunction != null) {
                    successFunction(result);
            }
            else {
                //alert(result);
        }

            if (isLoadingOpt)
                $('.loading').hide();
        },
            error: function (e) {
                if (errorFunction != null) {
                    errorFunction(e);
            }
            else {
                //alert("Error");
        }

            if (isLoadingOpt)
                $('.loading').hide();
 }
    });
    };

var fnRenderHTML = function () {
    var container = null, htmlTemplate = null, items = null, helpers = null, afterRenderFunction = null, removePrevHtml = true;

    if (arguments.length >= 7 || arguments.length < 3) {
        return alert("Parameter Error");
    }
    else if (arguments.length == 6) {
        container = arguments[0];
        htmlTemplate = arguments[1];
        items = arguments[2];
        helpers = arguments[3];
        afterRenderFunction = arguments[4];
        removePrevHtml = arguments[5];
    }
    else if (arguments.length == 5) {
        container = arguments[0];
        htmlTemplate = arguments[1];
        items = arguments[2];
        helpers = arguments[3];
        afterRenderFunction = arguments[4];
    }
    else if (arguments.length == 4) {
        container = arguments[0];
        htmlTemplate = arguments[1];
        items = arguments[2];
        helpers = arguments[3];
    }
    else {
        container = arguments[0];
        htmlTemplate = arguments[1];
        items = arguments[2];
    }

    if (helpers != null) {
        $.templates({
                tmpl: {
                    markup: htmlTemplate,
                helpers: helpers
    }
    });

    if (removePrevHtml) {
        $(container).html($.render.tmpl(items));
    }
    else {
        $(container).append($.render.tmpl(items));
    }
    }
    else {
        tmpl = $.templates(htmlTemplate);
        if (removePrevHtml) {
            $(container).html(tmpl.render(items));
        }
        else {
            $(container).append(tmpl.render(items));
}
    }

    if (afterRenderFunction != null) {
        afterRenderFunction();
    }
    };

var fnLoadTemplate = function () {
    var templateURL = null;
    var successFunction = null;
    var errorFunction = null;
    var resourceData = null;

    if (arguments.length >= 5 || arguments.length < 1) {
        return alert("Parameter Error");
    }
    else if (arguments.length == 4) {
        templateURL = arguments[0];
        successFunction = arguments[1];
        errorFunction = arguments[2];
        resourceData = arguments[3];
    }
    else if (arguments.length == 3) {
        templateURL = arguments[0];
        successFunction = arguments[1];
        errorFunction = arguments[2];
    }
    else if (arguments.length == 2) {
        templateURL = arguments[0];
        successFunction = arguments[1];
    }
    else {
        templateURL = arguments[0];
    }

    $.get(STATICFILELOCATION + '/templates' +templateURL, function (data) {
        // replace all resource text
        if (resourceData != null) {
            data = fnReplaceTextUsingResourceData(resourceData, data);
        }

        if (successFunction != null) {
            successFunction(data);
        }
    else { }
    }).fail(function () {
        if (errorFunction != null) {
            errorFunction();
    }
     //else { alert('failed to load template'); }
    });
    };

var fnReplaceTextUsingResourceData = function (resourceData, textData) {
    var matches = textData.match(/[^<%]+(?=\%>)/g);
    $(matches).each(function () {
        var resource = getItemFromJsonObject(resourceData, 'Key', this);
        if (resource == null || resource.length == 0) {
            textData = textData.replace('<%' +this + '%>', '');
        }
        else {
            textData = textData.replace('<%' +this + '%>', resource[0].Value);
}
    });

    return textData;
    };

var fnOpenModalPop = function () {
    var controlId = null;
    var title = null;
    var contents = null;
    var firstButtonFunction = null;
    var secondButtonFunction = null;
    var firstButtonText = null;
    var secondButtonText = null;

    if (arguments.length >= 8 || arguments.length < 3) {
        return alert("Parameter Error");
    }
    else if (arguments.length == 7) {
        controlId = arguments[0];
        title = arguments[1];
        contents = arguments[2];
        firstButtonFunction = arguments[3];
        secondButtonFunction = arguments[4];
        firstButtonText = arguments[5];
        secondButtonText = arguments[6];
    }
    else if (arguments.length == 5) {
        controlId = arguments[0];
        title = arguments[1];
        contents = arguments[2];
        firstButtonFunction = arguments[3];
        secondButtonFunction = arguments[4];
        firstButtonText = 'OK';
        secondButtonText = 'NO';
    }
    else if (arguments.length == 4) {
        controlId = arguments[0];
        title = arguments[1];
        contents = arguments[2];
        firstButtonFunction = arguments[3];
        firstButtonText = 'OK';
    }
    else {
        controlId = arguments[0];
        title = arguments[1];
        contents = arguments[2];
    }

    $.flexModal.add(controlId, function () {
        var $modalContent = $(this).children();
        $modalContent.html('');

        var response = { };
        response.Title = title;
        response.Contents = contents;

        fnLoadTemplate('/account/confirm.html',
            function (data) {
                var helpers = {
            };

                fnRenderHTML($modalContent, data, response, helpers);
                if (secondButtonFunction != null) {
                    $('#btn_cancel').text(secondButtonText);
                    $('#btn_cancel').show();
                    $('#btn_cancel').on('click', function () {
                        secondButtonFunction();
                });
            }
                if (firstButtonFunction != null) {
                    $('#btn_ok').text(firstButtonText);
                    $('#btn_ok').show();
                    $('#btn_ok').on('click', function () {
                        firstButtonFunction();
                });
            }
        }, null, getResourceData('Account', getCurrentLanguage())
        );

        $(controlId).addClass("flex-modal-item flex-modal-item--ready flex-modal-item--visible");
    });
    };

var fnOpenModalPopForOneButton = function () {
    var controlId = null;
    var title = null;
    var contents = null;
    var okFunction = null;
    var btnOK_Text = null;

    if (arguments.length >= 6 || arguments.length < 3) {
        return alert("Parameter Error");
    }
    else if (arguments.length == 5) {
        controlId = arguments[0];
        title = arguments[1];
        contents = arguments[2];
        okFunction = arguments[3];
        btnOK_Text = arguments[4];
    }
    else if (arguments.length == 4) {
        controlId = arguments[0];
        title = arguments[1];
        contents = arguments[2];
        okFunction = arguments[3];
    }
    else {
        controlId = arguments[0];
        title = arguments[1];
        contents = arguments[2];
    }

    $.flexModal.add(controlId, function () {
        var $modalContent = $(this).children();
        $modalContent.html('');

        var response = { };
        response.Title = title;
        response.Contents = contents;

        fnLoadTemplate('/account/confirmonebutton.html',
            function (data) {
                var helpers = {
            };

                fnRenderHTML($modalContent, data, response, helpers);
                if (okFunction != null) {
                    $('#btn_ok').show();
                    $('#btn_ok').on('click', function () {
                        okFunction();
                });
            }
                //Change button text
                if (btnOK_Text) {
                    $('#btn_ok').text(btnOK_Text);
            }
        }, null, getResourceData('Account', getCurrentLanguage())
        );

        $(controlId).addClass("flex-modal-item flex-modal-item--ready flex-modal-item--visible");
    });
    };

var fnOpenVideoPopup = function (iFrameId, videoUrl) {
    $(iFrameId).attr('src', videoUrl);
    $('#btnOpenVideo').click();
    };

var fnShowVideoPopUp = function (video, src) {
    if (src == "youtube") {
        var video_content = '<div class="video-container"><iframe width="900" height="500" src="https://www.youtube.com/embed/' +video + '?rel=0&autoplay=1" frameborder="0" allowfullscreen></iframe></div>'
}
else {
    var video_content = '<div style="margin:-10px -5px;"><video width="100%" autoplay controls onended="loopVideo(this)"><source src="http://www.forever21.com/images/video/' + src + '/' +video + '.mp4" type="video/mp4"></video><div>'
    }

    $.flexModal.add('#quickview_pop', function () {
        var $modalContent = $(this).children();
        $modalContent.html('');

        var response = { };
        response.Contents = video_content;

        fnLoadTemplate('/account/videopop.html',
            function (data) {
                var helpers = {
            };

                fnRenderHTML($modalContent, data, response, helpers);
        }, null, null);

    $('#quickview_pop').addClass("flex-modal-item flex-modal-item--ready flex-modal-item--visible");
 });
 };
     //function fnMakeSelectControlObject(deviceType, items) {
     //    var result = '';
     //    var template = '';

     //    if (deviceType.toUpperCase() == 'DESKTOP')
     //        template = '<dd><a href="#"{{if isSelect == true}} class="t_pink"{{/if}}>{{:name}}</a></dd>';
     //    else
     //        template = '<option value="{{:value}}"{{if isSelect == true}} selected{{/if}}>{{:name}}</option>';

     //    var tmpl = $.templates(template);
     //    return tmpl.render(items);
     //}

     /******************************************************
     //-- Common Validator --
     No. : Date        : Name            : Detail
     1   : 03/06/2017  : dayeon.k        : Created
     *******************************************************
     how to use :
       addMethod -> [{ name: "nonSpecialChar"
                     , method: function (value, element) { return this.optional(element) || !(/[@~!\#$^&*\=+|:;?"<,.>']/.test(value));}
                     , message: "Do not use special characters such as #, $, or &amp;"}]
       rules    -> Ex) { 'txt_ex': { required: true, email: true } }
       messages -> Ex) { 'txt_ex': { required: 'Please enter email address', email: 'Invalid email' } }
       errorPlacement -> Customize placement of created error labels.
                         Ex) <input type="email" id="txt_ex" name="txt_ex" data-error="#tooltip_ex">
                             <div id="tooltip_ex" style="display: none;"></div>
     */
     function fnInitValidate(contolFormId, rules, messages, addMethodArr) {
         //Add a custom validation method.
         // [{ name, method, message }, ...]
         if (addMethodArr != null && addMethodArr.length > 0) {
             for (var i = 0; i < addMethodArr.length; i++) {
                 jQuery.validator.addMethod(addMethodArr[i].name, addMethodArr[i].method, addMethodArr[i].message);
     }
     }

         //jquery validation
         return $(contolFormId).validate({
             ignore: [],
             errorElement: "div",
             errorClass: "tooltip",
             highlight: false,
             rules: rules,
             messages: messages,
                 errorPlacement: function (error, element) {
                     var placement = $(element).data('error');
                     if (placement) {
                $(placement).html(error);
                $(placement).show();
                     } else {
                error.insertAfter(element);
         }
 }
    });
    };

    function fnIsGuest() {
        //"UPUS" cookie 값에서
        // Y : Guest
        if (fnGetAcctInfoFromCookie() != null && fnGetAcctInfoFromCookie().Guest.toUpperCase() == "Y") {
            return true;
            }
    return false;
    };

    function fnIsLoggedIn() {
        //"LoggedInUS" cookie 값
        // 0 :
        // 1 : LoggedIn
        if(getCookie("LoggedIn" + COOKIE_POSTFIX) != '' && getCookie("LoggedIn" +COOKIE_POSTFIX) == "1") {
            return true;
            }
    return false;
    };

    function fnGetUserId() {
        if (fnGetAcctInfoFromCookie() != null && fnGetAcctInfoFromCookie().Id != '') {
            return fnGetAcctInfoFromCookie().Id;
            }
    return "";
    };

    function fnGetUserName() {
        if (fnGetAcctInfoFromCookie() != null && fnGetAcctInfoFromCookie().FirstName != '') {
            return fnGetAcctInfoFromCookie().FirstName;
            }
    return "";
    };

var fnGetMyPicture = function () {
    if (fnGetAcctInfoFromCookie() != null && fnGetAcctInfoFromCookie().ProfileImage != '') {
        return fnGetAcctInfoFromCookie().ProfileImage;
        }
    return "";
    };

var fnSearch = function () {
    var searchText = $('#ihKeyword').val();
    if (searchText === '')
        searchText = $('#txtBloomreachSearch').val();

    searchText = $.trim(searchText);
    if (searchText !== '') {
        
        if (typeof fnSendBloomreachData != 'undefined' && $.isFunction(fnSendBloomreachData)) {
            // if use Bloomreach
            location.href = SITE_PREFIX + '/search/#brm-search?request_type=search&search_type=keyword&q=' + searchText + '&l=' + searchText;
        }
        else {
            location.href = SITE_PREFIX + '/search/?val=' + searchText;
        }
        
    }
    return false;
    };

var fnSearchKeyFocusOn = function (e) {
    $('#search_placeholder').hide();
    $('#search_placeholder_mobile').hide();
    };

var fnSearchKeyFocusOutDesktop = function (e) {
    var searchText = ''

    searchText = $('#ihKeyword').val();
    $('#txtBloomreachSearch').val('');

    if (searchText === '') {
        $('#search_placeholder').show();
        $('#search_placeholder_mobile').show();
        }
        };
var fnSearchKeyFocusOutMobile = function (e) {
    var searchText = ''

    searchText = $('#txtBloomreachSearch').val();
    $('#ihKeyword').val('');

    if (searchText === '') {
        $('#search_placeholder').show();
        $('#search_placeholder_mobile').show();
 }
 };
     //-- common LogOut function --
     function fnLogOut() {
         var rediretURL = null;

         //remove cookies
         if(getCookie("chkMigrateBasket") != '')
             deleteCookie("chkMigrateBasket");
         if(getCookie("WishListData") != '')
             deleteCookie("WishListData");
         if(getCookie("MyDefaultList") != '')
             deleteCookie("MyDefaultList");
         if(getCookie("LoginCheck" +COOKIE_POSTFIX) != '')
             deleteCookie("LoginCheck" +COOKIE_POSTFIX);
         if(getCookie("UserTrace" +COOKIE_POSTFIX) != '')
             deleteCookie("UserTrace" +COOKIE_POSTFIX);
         if(getCookie("WishListData" +COOKIE_POSTFIX) != '')
             deleteCookie("WishListData" +COOKIE_POSTFIX);
         if(getCookie("RecentlyViewed" +COOKIE_POSTFIX) != '')
             deleteCookie("RecentlyViewed" + COOKIE_POSTFIX);
         if (getCookie("LoggedUser" + COOKIE_POSTFIX) != '')
             deleteCookie("LoggedUser" + COOKIE_POSTFIX);
         if (getCookie("SOCOUPON") != '')
             deleteCookie("SOCOUPON");
         
         //remove user info
         if(getCookie(AcctInfoCookieName) != '')
             deleteCookie(AcctInfoCookieName);

         //추가한거
         //delete
         if(getCookie("LoggedIn" +COOKIE_POSTFIX) != '')
             deleteCookie("LoggedIn" +COOKIE_POSTFIX);

         if (arguments.length == 1) {
             rediretURL = arguments[0];
             }
             else {
                 rediretURL = SITE_PREFIX + '/';
    }

    location.href = rediretURL;
 };

     //-- Check logged in, before page Load
     function fnPreloadForLoggedin(isCheckForLoggedin, rediretURL, firstFunction) {
         if (firstFunction !== undefined || firstFunction != null) {
             firstFunction();
     }

         // isCheckForLoggedin: true -> do redirect when user logged in.
         if (isCheckForLoggedin) {
             if(fnIsLoggedIn() && fnGetUserId() != "" && !fnIsGuest()) {
                 location.href = rediretURL;
         }
         }
             // isCheckForLoggedin: false -> do redirect when user not logged in.
         else {
             if (!fnIsLoggedIn() || fnGetUserId() == "") {
                 location.href = rediretURL;
 }
    }
    };

var fnToggleContent = function (titleId, contentId) {
    $('#' +titleId).toggleClass('active');
    $('#' +contentId).slideToggle();
    };

var formatCurrency = function (num) {
    var retValue = '';

    num = num.toString().replace(/\$|\,/g, '');
    if (isNaN(num))
        num = "0";
    sign = (num == (num = Math.abs(num)));
    num = Math.floor(num * 100 +0.50000000001);
    cents = num % 100;
    num = Math.floor(num / 100).toString();
    if (cents < 10)
        cents = "0" +cents;
    for (var i = 0; i < Math.floor((num.length -(1 +i)) / 3) ; i++)
        num = num.substring(0, num.length - (4 * i + 3)) + ',' +
            num.substring(num.length - (4 * i + 3));

    
    var curLanguage = getCookie('_cl' + COOKIE_POSTFIX).substring(0, 2);

    switch (COOKIE_POSTFIX.toUpperCase())
    {
        case 'US':
            retValue = (((sign) ? '' : '-') + '$' + num + '.' + cents);
            break;

        case 'CA':
            if (curLanguage.toLowerCase() === 'en')
                retValue = (((sign) ? '' : '-') + 'CAD $' + num + '.' + cents);
            else if (curLanguage.toLowerCase() === 'fr')
                retValue = (((sign) ? '' : '-') + num + ',' + cents + ' $ CAD');
            else
                retValue = (((sign) ? '' : '-') + 'CAD $' + num + '.' + cents);
            break;

        case 'UK':
            retValue = (((sign) ? '' : '-') + '£' + num + '.' + cents);
            break;

        case 'EU':
            if (curLanguage.toLowerCase() === 'en')
                retValue = (((sign) ? '' : '-') + '€' + num + ',' + cents);
            else if (curLanguage.toLowerCase() === 'de')
                retValue = (((sign) ? '' : '-') + num + ',' + cents + '€');
            else if (curLanguage.toLowerCase() === 'es')
                retValue = (((sign) ? '' : '-') + num + ',' + cents + '€');
            else if (curLanguage.toLowerCase() === 'fr')
                retValue = (((sign) ? '' : '-') + num + ',' + cents + ' €');
            else if (curLanguage.toLowerCase() === 'it')
                retValue = (((sign) ? '' : '-') + num + ',' + cents + '€');
            else if (curLanguage.toLowerCase() === 'nl')
                retValue = (((sign) ? '' : '-') + '€ ' + num + ',' + cents);
            else
                retValue = (((sign) ? '' : '-') + '€ ' + num + ',' + cents);
            break;

        default:
            retValue = (((sign) ? '' : '-') + '$' + num + ',' + cents);
            break;
    }

    return retValue;
 };

     //-- Password Show & Hide event
     var fnClickShowPW = function () {
         var control = [];
         var showText = 'SHOW', hideText = 'HIDE';

         //Because it does not work on Firefox, must defined evnet.
         var event;
         if (arguments.length == 5) {
             event = arguments[0], showText = arguments[1], hideText = arguments[2], control[0]= arguments[3], control[1]= arguments[4];
    }
    else if (arguments.length == 4) {
        event = arguments[0], showText = arguments[1], hideText = arguments[2], control[0]= arguments[3];
    }
    else {
        return alert("Parameter Error");
     }

         //if (!event) event = window.event;

         for (var i = 0; i < control.length; i++) {
             if($(control[i]).attr('type') == 'password') {
                 $(control[i]).attr('type', 'text');
                 event.target.innerHTML = hideText;
         }
        else if($(control[i]).attr('type') == 'text') {
            $(control[i]).attr('type', 'password');
            event.target.innerHTML = showText;
 }
 }
 };

     //-- Syncronize value
     var fnSyncValueDoubleControl = function (control, toSyncControl) {
         $(toSyncControl).val($(control).val());
 }

     //-- check byte
     var checkByte = function (str) {
         var passValue = true;
         for (var i = 0; i < str.length; i++) {
             if (str.charCodeAt(i) > 127) {
                 passValue = false;
                 break;
     }
     }
         return passValue;
 };

     //-- on key press
     var fnOnKeyPressSubmit = function (e, submitFunc) {
         
         var code = e.charCode || e.keyCode;
         // Enter pressed?
         if (code == 10 || code == 13) {
             e.preventDefault();
             if (submitFunc != null) submitFunc();
             }
    return false;
 };

     //-- Get AM/PM date format like 10:00 AM
     var fnFormatAMPM = function (date) {
         var hours = date.getHours();
         var minutes = date.getMinutes();
         var ampm = hours >= 12 ? 'PM': 'AM';
         hours = hours % 12;
         hours = hours ? hours: 12; // the hour '0' should be '12'
         minutes = minutes < 10 ? '0' +minutes: minutes;
         var strTime = hours + ':' + minutes + ' ' +ampm;
    return strTime;
 };

     //-- Open new window
     var fnOpenNewWindow = function (url, target) {
         window.open(url, target);
         };

     var fnSetPager = function (no, size, total, selector, isShowText, isAddClassfr) {
         html = '', first = 1, end = Math.ceil(total / size);
         var class_fr = "class='fr'";
         var previousTextTag = "<span class='hide_mobile'>Previous</span>";
         var nextTextTag = "<span class='hide_mobile'>Next</span>";

         if (isAddClassfr == null) isAddClassfr = true;
         if (isShowText == null) isShowText = false;

         if (end < 6) {
             html = "<ul " + (isAddClassfr ? class_fr : '') + ">" +
                 "<li class='pageno'><span class='p_prev'></span>" + (isShowText ? previousTextTag : "") + "</li>";

             for (var i = 0; i < end; i++) {
                 if (no == first +i) {
                html += "<li class='t_pink underline pageno'>" + (first +i) + "</li>";
             }
             else {
                html += "<li class='pageno'>" + (first +i) + "</li>";
         }
        }

        html += "<li class='pageno'>" + (isShowText ? nextTextTag : "") + "<span class='p_next'></span></li>" +
                 "</ul>";
         }
         else {
             if (no <= 2) {
                 html = "<ul " + (isAddClassfr ? class_fr : '') + ">" +
                     "<li class='pageno'><span class='p_prev'></span>" + (isShowText ? previousTextTag : "") + "</li>";

            for (var i = 0; i < 3; i++) {
                if (no == first +i) {
                    html += "<li class='t_pink underline pageno'>" + (first +i) + "</li>";
                }
                else {
                    html += "<li class='pageno'>" + (first +i) + "</li>";
}
         }

            html += "<li class='dot'>...</li>" +
                "<li class='pageno'>" + end + "</li>" +
                "<li class='pageno'>" + (isShowText ? nextTextTag : "") + "<span class='p_next'></span></li>" +
                     "</ul>";
         }
         else if (2 < no && no < end -1) {
            html = "<ul " + (isAddClassfr ? class_fr : '') + ">" +
                "<li class='pageno'><span class='p_prev'></span>" + (isShowText ? previousTextTag : "") + "</li>" +
                "<li class='pageno'>" + first + "</li>" +
                "<li class='dot'>...</li>" +
                "<li class='pageno'>" +(no - 1) + "</li>" +
                "<li class='t_pink underline pageno'>" +(no) + "</li>" +
                "<li class='pageno'>" + (parseInt(no) + 1) + "</li>" +
                "<li class='dot'>...</li>" +
                "<li class='pageno'>" + end + "</li>" +
                "<li class='pageno'>" + (isShowText ? nextTextTag : "") + "<span class='p_next'></span></li>" +
                "</ul>";
         }
         else if (end -2 <= no) {
            html = "<ul " + (isAddClassfr ? class_fr : '') + ">" +
                "<li class='pageno'><span class='p_prev'></span>" + (isShowText ? previousTextTag : "") + "</li>" +
                "<li class='pageno'>" + first + "</li>" +
                "<li class='dot'>...</li>";
            for (var i = 2; i >= 0; i--) {
                if (no == end -i) {
                    html += "<li class='t_pink underline pageno'>" + (end -i) + "</li>";
                }
                else {
                    html += "<li class='pageno'>" + (end -i) + "</li>";
                }
            }
            html += "<li class='pageno'>" + (isShowText ? nextTextTag : "") + "<span class='p_next'></span></li>" + "</ul>";
         }
         }
         // Deactivate arrows when user is at edges of list (1 or end)
        $.each(selector, function (index, value) {
            $(value).html(html);
            if (no == "1") $(value).find('.p_prev').addClass("inactive");
            if (no == end) $(value).find('.p_next').addClass("inactive");
         });
     };

var fnRequestForgotPassword = function () {
    var requestEmail = null;
    var successFunction = null;
    var errorFunction = null;
    var isLoadingOption = null;

    if (arguments.length >= 5 || arguments.length < 1) {
        return alert("Parameter Error");
    }
    else if (arguments.length == 4) {
        requestEmail = arguments[0];
        successFunction = arguments[1];
        errorFunction = arguments[2];
        isLoadingOption = arguments[3];
    }
    else if (arguments.length == 3) {
        requestEmail = arguments[0];
        successFunction = arguments[1];
        errorFunction = arguments[2];
        isLoadingOption = false;
    }
    else if (arguments.length == 2) {
        requestEmail = arguments[0];
        successFunction = arguments[1];
        isLoadingOption = false;
    }
    else {
        requestEmail = arguments[0];
        isLoadingOption = false;
    }

    executeAJAX("/Account/ForgetPassword", "POST", "JSON",
        {
                email: requestEmail
    },
        true,
        successFunction,
        errorFunction,
        isLoadingOption
    );
 };

     //정규식 검사를 하는 함수입니다.
     //검사를 위한 정규식 패턴과 검사 문자열을 매개변수로 받습니다.
     //검사를 완료하고 검사 결과를 리턴합니다.
     //함수를 호출한 곳에서는 리턴값의 null 여부를 확인하고 사용합니다.
     var fnRegExec = function (pattern, text) {
         obj = pattern.exec(text);

         if (obj) {
             return obj[0];
         }
         else {
             return null;
 }
 };

     //To trim spaces from the start and end of the string.
     var fnTrimStartEnd = function (str) {
         return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
 };

     //Same as .NET String.Format function
     String.Format = function (b) {
         var a = arguments;
         return b.replace(/(\{\{\d\}\}|\{\d\})/g, function (b) {
             if(b.substring(0, 2) == "{{") return b;
             var c = parseInt(b.match(/\d/)[0]);
             return a[c +1]
 })
 };

     //현재 페이지의 스크롤 포지션 정보를 저장하는 함수입니다.
     //얻은 데이터는 페이지의 URI 와 함께 sessionStorage 에 저장됩니다.
     var fnSetNavigation = function () {
         var storredData = [];
         var data = {
             'url': document.URL,
             'position': $(document).scrollTop()
    };

    if(JSON.parse(sessionStorage.getItem('storredData') != null)) {
        storredData = JSON.parse(sessionStorage.getItem('storredData'));
        sessionStorage.removeItem('storredData');

        $.each(storredData, function (index, value) {
            if (value != undefined && value.url == document.URL) {
                storredData.splice(index, 1);
    }
     });
    }

         storredData.push(data);

         sessionStorage.setItem('storredData', JSON.stringify(storredData));
 }

     // Click event for customId Question icon
     var fnClickCustomIDQuestion = function () {
         var countrycode = '';

         // if selected country
         if ($('#hd_country'))
             countrycode = $('#hd_country').val();

         if (getCurrentLanguage() == 'ko-KR' || countrycode == 'KR') {
             fnOpenNewWindow('https://unipass.customs.go.kr/csp/persIndex.do', '_blank');
 }
 }

     //현재 접속한 환경의 디바이스 정보를 확인합니다.
     //접속한 디바이스의 환경을 조회하고 싶을 때는 object 에 값을 추가하도록 함수를 수정합니다.
     //함수를 호출한 곳에서는 data 의 error 값을 확인한 뒤 isMobile 값으로 디바이스의 환경을 확인합니다.
     var fnCheckDeviceType = function (data) {
         if (!Array.isArray(data) && typeof data == "object") {
             if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
                 || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
                 data.isMobile = true;
             //data.deviceName = '';
         }
         else {
             data.isMobile = false;
        }
        data.error = false;
     }
     else {
         data.error = true;
 }
 }

     //--CookiePopup
     var fnCheckShowCookiePopup = function () {
         var hideCookiePopup = getCookie('hideCookieNotice');

         if (hideCookiePopup !== 'Y') {
             $('.cookie').show();
         }
         else if (window.location.pathname.toLowerCase() == SITE_PREFIX + "/" || window.location.pathname.toLowerCase() == SITE_PREFIX) {
                 fncheckCount_SignUp();
         }
     }

     var fnClosePop_CookieNotice = function () {
         setCookie('hideCookieNotice', 'Y', 30);
         $('.cookie').hide();

         if (window.location.pathname.toLowerCase() == SITE_PREFIX + "/" || window.location.pathname.toLowerCase() == SITE_PREFIX) {
             fncheckCount_SignUp();
         }
     }

     // Convert Date Format
     var fnConvertDateFromTimeStamp = function (timeStamp) {
         var date = new Date(timeStamp);
         var year = date.getFullYear();
         var month = '0' +(date.getMonth() + 1);
         var day = '0' +date.getDate();
         return month.substr(-2) + '/' + day.substr(-2) + '/' +year;
 };

     //--Event Bind
     var fnNewEventBind = function (id, event, functionContent) {
         $('#' +id).on(event, function () {
             functionContent();
    });
    }

var fnNewEventunBind = function (id, event) {
    $('#' +id).off(event);
    }

$(function () {
        /* Mobile Slide Menu */
        $(".icon_menu").on("click", function () {
            $(".c_container, .mobile_overlay, .l_container, .signup_wrapper").addClass("open");
            $("html").addClass('noscroll');
            });
        $(".mobile_overlay").on("click", function () {
            $(".c_container, .mobile_overlay, .l_container,.signup_wrapper").removeClass("open");
            $("html").removeClass('noscroll');
    });

        /* Address Book Right Slide */
        $(".btn_right_side").on("click", function () {
            $(".r_container, .desktop_overlay").addClass("open");
            $('html').addClass('noscroll');
            });
        $(".r_container .icon_close, .desktop_overlay").on("click", function () {
            $(".r_container, .desktop_overlay").removeClass("open");
            $("#open_specialOffers").removeClass("show").addClass("hide");
            $('#divQuickView').html('');

            $('html').removeClass('noscroll');
            $('.soCouponPopClass').css('display', 'none');
    });

        /* SignUp Pop */
        $(".signup_slider .icon_close").on("click", function () {
            $(".signup_slider").css("display", "none");
    });

        /* Mobile Search Box */
        $(".m_header .nav_secondary .icon_search").on("click", function () {
            $(".m_search_container").slideToggle();
            });
        $(".m_search_container .icon_close").on("click", function () {
            $(".m_search_container").slideToggle();
    });

        /* Desktop Search Box */
        $(".show_desktop .icon_search").click(function () {
            $(".d_search_container").animate({ width: 'toggle'
    });
    });
$(".d_search_container .icon_close").click(function () {
    $(".d_search_container").animate({ width: 'toggle'
    });
    });

        /* Scroll */
        $(window).scroll(function () {
            if ($(this).scrollTop() > 400) {
                $('.scrollToTop').fadeIn();
                $('#styleBoldChat').fadeIn();
        } else {
            $('.scrollToTop').fadeOut("fast");
            $('#styleBoldChat').fadeOut("fast");
    }
    });
$('.scrollToTop').click(function () {
    $('html, body').animate({
        scrollTop: 0
}, 900);
    return false;
    });

    /* Mobile Left Menu */
    $('.l_container .mega_menu.first_menu').each(function () {
        $(this).click(function () {
            //$(this).toggleClass('active');
            //$(this).find('.mega_sub').slideToggle();
            var childMenuId = '#ChildMenu_' + $(this).data('menu-key');
            if ($(childMenuId).length > 0) {
                if ($('#NavParent').hasClass('show')) {
                    $('#NavParent').removeClass('show').addClass('hide');
                    $(childMenuId).show();
                    $('#NavChild').removeClass('hide').addClass('show');
                }
                else {
                    $('#NavChild').removeClass('show').addClass('hide');
                    $(childMenuId).hide();
                    $('#NavParent').removeClass('hide').addClass('show');
                }
            }
        });
    });

    $('.l_container .mega_menu.second_menu').each(function () {
        $(this).click(function () {
            $(this).toggleClass('active');
            $(this).find('.mega_sub').slideToggle();
    });
    });

    $('.mega_sub .go_back').each(function () {
        $(this).click(function () {
            $('#NavChild').removeClass('show').addClass('hide');
            $('[id^=ChildMenu_]').hide();
            $('#NavParent').removeClass('hide').addClass('show');
    });
    });

        /* Dropdown */
        $('.drop_p').each(function () {
            $(this).click(function () {
                if($(this).next().hasClass('drop_c'))
                $(this).next().toggleClass('open');
            else
                $(this).children('.drop_c').toggleClass('open');
    });
    });
$('div.drop_c.b_gray').each(function () {
    $(this).click(function () {
        $(this).toggleClass('open');
    });
    });

        /* Checkout Slide */
        $('.expand_p').each(function () {
            $(this).off('click');
            $(this).click(function () {
                $(this).toggleClass('active');
                $(this).next().slideToggle();
    });
    });

        /* Input*/
        $('.input_label').each(function () {
            $(this).click(function () {
                $(this).children('input').focus();
                $('.input_label').each(function () {
                if ($(this).children('input').val() == '') {
                    $(this).removeClass('focus');
                    $(this).find('.icon_delete').hide();
                }
            });
            $(this).addClass('focus');
        });

            /* Focus and focusout for input */
            $(this).find('input,textarea').focus(function () {
                $(this).parent('.input_label').addClass('focus');
        }).blur(function () {
            if($(this).val() == '') {
                $(this).parent('.input_label').removeClass('focus');
                $(this).parent('.input_label').find('.icon_delete').hide();
        }
        });

            // show and hide delete icon
            $(this).find('input').keydown(function () {
                if($(this).val() == '')
                $(this).parent('.input_label').find('.icon_delete').hide();
            else
                $(this).parent('.input_label').find('.icon_delete').show();
    });
    });

        /* Mobile Dropmenu */
        window.onresize = function (event) {
            if (window.innerWidth > 767) {
                $('.nav_c').show();
                $('#left_menu').show();
                $('#account_left_menu').attr('style', '');
    }
    };

if (window.innerWidth > 767) {
    $('.nav_c').show();
    $('#left_menu').show();
    $('#account_left_menu').attr('style', '');
    }

        /* Filter Dropdown */
        $('.m_filer').click(function () {
            $('.side_menu').slideToggle();
            $('header').css('z-index', '1');
            $('.side_content').css('position', 'fixed !important');
            $('footer').css('position', 'fixed !important');
            $('body').css({ 'position': 'fixed', 'overflow-y': 'hidden'
    });
    });

        /* clear input */
        $('.icon_delete').click(function () {
            $(this).parent('.input_label').find('input').each(function () {
                $(this).val('');
                $(this).valid();
    });
    });

        /* tab Menu*/
        //if(matchMedia("screen and (min-width: 1024px)").matches) {
        if (window.innerWidth >= 768) {
            $(".tab_m > div").click(function () {
                var tabGroup = $(this).parent().parent();
                var tabMenuGroup = tabGroup.find(".tab_m > div");

            tabMenuGroup.removeClass("active");
            $(this).addClass("active");

            var index = tabMenuGroup.index(this);

            tabGroup.find(".tab_c > div").addClass("hide");
            tabGroup.find(".tab_c > div:eq(" +index + ")").css('display', 'none').removeClass("hide").fadeIn(500);
        });
        } else {
            $(".tab_m > div").mouseenter(function () {
                var tabGroup = $(this).parent().parent();
                var tabMenuGroup = tabGroup.find(".tab_m > div");

            tabMenuGroup.removeClass("active");
            $(this).addClass("active");

            var index = tabMenuGroup.index(this);

            tabGroup.find(".tab_c > div").addClass("hide");
            tabGroup.find(".tab_c > div:eq(" +index + ")").css('display', 'none').removeClass("hide").fadeIn(500);
    });
    }

        /* Header Fixed Scroll */
        $(window).scroll(function () {
            if ($(this).scrollTop() > 10) {
                $('header').addClass('header_fixed');
                $('main,footer').addClass('main_fixed');
        } else {
            $('header').removeClass('header_fixed');
            $('main,footer').removeClass('main_fixed');
    }
    });
})