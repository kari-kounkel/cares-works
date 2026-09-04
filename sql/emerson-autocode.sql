-- Auto-code Social Services of Minnesota bank lines by payee.
--
-- Premier Bank descriptions name the merchant, so most of the register can be
-- coded without anyone reading it. This is deliberately conservative: a rule is
-- here only when the payee settles the account by itself. Anything else stays
-- Uncategorized, where it is visible and fixable, rather than being guessed into
-- a plausible-looking account.
--
-- It is safe to re-run. Only rows with no category are touched, so hand
-- corrections are never overwritten, and new rows (Plaid, later statements)
-- pick up the same rules on the next run.
--
-- Coverage when written: 88% of expense rows, 85% of income rows. Nearly all of
-- the remainder is checks — the statement gives a number and an amount but never
-- a payee, so only Matt can name them.

\set org '5b0ccbdf-0727-4907-bfd2-3cd9fe4767e9'

-- ---- money in ------------------------------------------------------------
-- Medicaid and state billing is EARNED revenue (ASC 606), not a contribution.
-- Filing it as a donation would misstate the 990, so payer name decides it.
update ledger_entries e set category = c.cat
from (
  select id,
    case
      when description ~* 'UCARE MN DISBURS'          then 'Medicaid — peer support services'
      when description ~* 'HMO MINNESOTA'             then 'Medicaid — other billable services'
      when description ~* 'HEALTHPARTNERS|1410797853' then 'Medicaid — other billable services'
      when description ~* 'MN STATE-MMB|1416007162'   then 'Peer support — MN State (MMB)'
      when description ~* 'NUWAY RECOVERY'            then 'Peer support — NuWay Recovery'
      when description ~* 'PARTNERS BEH'              then 'Peer support — Partners Behavioral Health'
      when description ~* 'HENNEPIN COUNTY'           then 'Government grants & contracts'
      when description ~* 'MOBILE DEVICE TRANSFER'    then 'Transfer between our accounts'
      -- A bare DEPOSIT is a counter deposit of cash or checks. Earned until shown
      -- otherwise; calling it a contribution is the error that costs more.
      when description ~* '^DEPOSIT'                  then 'Program revenue'
    end as cat
  from ledger_entries
  where org_id = :'org' and direction = 'in' and (category is null or category = '')
) c
where e.id = c.id and c.cat is not null;

-- ---- money out -----------------------------------------------------------
update ledger_entries e set category = c.cat
from (
  select id,
    case
      when description ~* 'GUSTO/NET'                     then 'Payroll — wages'
      when description ~* 'GUSTO/TAX'                     then 'Payroll taxes'
      when description ~* 'GUSTO/FEE|BENE:GUSTO'          then 'Payroll — wages'
      when description ~* '5X ?(PROPERTIES)?,? ?L/'       then 'Rent — program housing (5X Properties)'
      when description ~* 'XCEL ENERGY'                   then 'Utilities — electric (Xcel)'
      when description ~* 'CPENERGY|CENTERPOINTENERG|HOUSTON TX'
                                                          then 'Utilities — gas (CenterPoint)'
      when description ~* 'REPUBLICSERVICES|CITY OF OSEO|MPLS UTILITY|MUNICIPAL ONLINE|MERLES WATER'
                                                          then 'Utilities'
      when description ~* 'COMCAST|XFINITY|QUANTUM FIBER|NETSOL|AT ?&T'
                                                          then 'Internet & phone (Comcast / Lumen)'
      when description ~* 'OVERDRAFT'                     then 'Overdraft & ACH fees'
      when description ~* 'ACH (PROCESSING )?FEE|SC GLOBAL ITEM|CASH DEPOSITED|ELAVON|WIRE FEE'
                                                          then 'Bank, service & merchant fees'
      when description ~* 'CLA PAYER EXPRES'              then 'Accounting fees'
      when description ~* 'MICHIGAN MILLER'               then 'Insurance — property'
      when description ~* 'INSTITUTE FO|MARCOMN|METRO STATE FDTN|FACES & VOICES|MINNESOTA CE'
                                                          then 'Certification & training (CPRS)'
      when description ~* 'MN DVS|LICENS'                 then 'Licenses, permits & filings'
      -- hardware, building materials and vehicle repair all land in R&M; this is a
      -- sober-housing program, so the building IS the program.
      when description ~* 'HOME DEP|HOMEDEPOT|MENARDS|MNRD-|SHERWIN|HARBOR FREIGHT|FRATTALLONES|ACE HARDWARE|SITEONE|LOWE|ROCKLER|NORTH END HARDWARE|SIWEK|FLEET FARM|DAL-TILE|COREMARK|ERICKSON PLUMB|AQUARIUS HOME|LOCKSMITH|PLAZA TV|AFFORDABLE MATT|FAMOUS FURNIT|RENTAL C|WHITE BEAR RENTA|FREE GEEK|BACHMAN|FAIRS NURSERY|AUTO SALVA'
                                                          then 'Repairs & maintenance'
      when description ~* 'O.?REILLY|AUTOZONE|ROCK AUTO|MIDAS|FIRESTONE|VIOC |TIRE RACK|HANSON TIRE|KEY CADILLAC|ST PAUL PARK AUT|REPAIR RITE|CAR WASH|A-PREMIUM|US INSTR'
                                                          then 'Repairs & maintenance'
      when description ~* 'KWIK.?TRIP|HOLIDAY|SPEEDWAY|BP ?#|AMOCO|MUDFLAP|CASEYS|LOVE.?S #|CIRCLE ?K|MARATHON|FLYING J|KUM ?&|THORNTONS|SUNRAY BP|CLARK 2376|PRIME OIL|TOWN MART|M &H|CROSSTOWN|SHELL SERVICE|EXXON|BROBERGS|MURPHY|KEVIN S M|IN & OUT MARKET|HV OAKDALE|MISSISSIPPI MARK|BSAW'
                                                          then 'Vehicle gas & fuel'
      when description ~* 'UBER ?\*?(TRIP|ONE| PENDING)|UBER TRIP|SUNCNTRY|DELTA|SKIPLAGGED|PRICELN|MOTEL 6|COMFORT INN|CROWNE PLAZA|MARRIOTT|STAY INN|JACKPOT JUNCTION'
                                                          then 'Travel'
      when description ~* 'IMPARK|SPRUCE TREE PARK|VCN STPAU'
                                                          then 'Parking & tolls'
      when description ~* 'UBER ?\*?EATS|MCDONALD|BURGER KING|TACO BELL|TACO JOHNS|TACO LIBRE|SUBWAY|CHIPOTLE|STARBUCKS|CARIBOU|DENNY|PERKINS|IHOP|PANERA|WENDY|POPEYES|ARBYS|PIZZA HUT|PAPA JOHN|DAIRY QUEEN|GOLDEN CORRAL|OLIVE GARDEN|TEXAS ROADHOUSE|OUTBACK|RAISING CANES|CHICK-FIL-A|JIMMY JOHNS|LEEANN CHIN|TST ?\*?|SQ ?\*?|DAY BY DAY|CECIL|KEYS CAFE|HEN HOUSE|EL FRESCO|COSSETTA|JOSEPHS GRILL|KINCAID|WHITE CASTLE|NOODLES|PHO |KAJIKEN|ICHIDDO|A CHAU|BONCHON|PIADA|AI HUE|COLDSTONE|INSOMNIA|DUNKIN|SCOOTER|JAMBA|MASON.?S FAM|SHARELS|HAZELWOOD|MARCUS OAKDALE|BB.Q CHICKE|ROTI|SMOKET|VALLEY DINER|THE BEST STEAK|KING CAJUN|URBAN SKILLET|LUSCIOUS|MAC.?S DINER|OLYMPIA CAFE|BRICKHOUSE|ALOHA POKE|YUM KITCHEN|LEVY|CANTEEN|COFFEE|KITCHEN 601|LITTLE OVEN|MAD CHICKEN|SHAKE SHACK|JUICE BOX|GINKGO|CPI |CTLP |ACQUA|PINZ|BOBBY & STEVE|DAVES HOT CHICKE|HARK|MOROCCAN|MPLS MIDTOWN|DICK.?S BAR|SOUTHEATS|OLIVE AND LA|FRANK FROM P|FAMOUS DAVE|EASTSIDE FOOD|TASTE OF SAI|MODERN TIMES|GROUND FLOOR|LAKE MONSTERS|FEARLESS NUT|MID-AMERICA|TONO PIZZ|CORAS BEST|BREAD & CHOC|CROSSTOWN GAS'
                                                          then 'Meals & food'
      when description ~* 'CUB FOODS|ALDI|HY-VEE|WHOLEFDS|KOWALSKI|TARGET|WAL-?MART|WM ?#|WM SUPERCENTER|COSTCO|DOLLAR TR|DOLLAR TREE|KNOWLAN|HA TIEN|VIENGCHAN|MAHAR ASIAN|NORTH MARKET|ANGUS MEATS|NELSON CHEESE|MO.?S TROPICAL|WALGREENS|CVS/PHARM|NOKOMIS|SALLY BEAUTY|GREAT CLIPS|FACE FOUNDRI|NEW IMAGE|SETZER|NELSON VITALITY|MATTR '
                                                          then 'Program materials & client supplies'
      when description ~* 'OFFICE MAX|OFFICEMAX|FEDEX OFFIC|HOBBYLOBBY|HUB HOBBY|NAME BADGES|GAMESTOP|ZAGG|MICROSOFT STORE|EBAY|AMAZON'
                                                          then 'Office supplies'
      when description ~* 'USPS PO'                       then 'Shipping & postage'
      when description ~* 'YOUTUBEPREM|NETFLIX|APPLE\.?COM|APPLE COM|AMAZON PRIME|SPOKEO|NOW WIFI|SQSP|DOMAIN|ZOOM\.COM|GSUITE|GOOGLE|SUBSTACK|WEB FL|INTUIT QBOOKS'
                                                          then 'Memberships & subscriptions'
      when description ~* 'MOBILE DEVICE TRANSFER'        then 'Transfer between our accounts'
    end as cat
  from ledger_entries
  where org_id = :'org' and direction = 'out' and (category is null or category = '')
) c
where e.id = c.id and c.cat is not null;

-- What is left, and how much it is worth. Checks dominate: the bank prints a
-- number and an amount, never a payee.
select direction,
       count(*) filter (where category is null or category = '') uncoded,
       count(*) total,
       round(100.0 * count(*) filter (where category is not null and category <> '')
             / nullif(count(*), 0), 1) pct_coded,
       (coalesce(sum(amount_cents) filter (where category is null or category = ''), 0)) / 100.0
         as uncoded_dollars
from ledger_entries where org_id = :'org' group by 1;
